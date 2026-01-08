package com.bartr.matching.application.service;

import co.elastic.clients.elasticsearch._types.FieldValue;
import com.bartr.matching.UserDocument;
import com.bartr.matching.domain.entity.SwipeHistory;
import com.bartr.matching.domain.repositories.MatchHistoryRepository;
import com.bartr.matching.domain.repositories.SwipeHistoryRepository;
import com.bartr.matching.domain.repositories.UserElasticsearchRepository;
import com.bartr.common.core.exception.ErrorConstant;
import com.bartr.common.core.exception.ServiceException;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.elasticsearch.client.elc.NativeQuery;
import org.springframework.data.elasticsearch.core.ElasticsearchOperations;
import org.springframework.data.elasticsearch.core.SearchHit;
import org.springframework.data.elasticsearch.core.SearchHits;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
@AllArgsConstructor
public class MatchingService {

    private UserElasticsearchRepository userElasticsearchRepository;
    private ElasticsearchOperations elasticsearchOperations;
    private MatchHistoryRepository matchHistoryRepository;
    private SwipeHistoryRepository swipeHistoryRepository;
    private com.bartr.matching.application.service.UserSyncService userSyncService;
    private com.bartr.matching.UserServiceClient userServiceClient;

    @Transactional(readOnly = true)
    public List<UserDocument> findTopMatches(UUID keycloakId) {
        if (keycloakId == null) {
            log.error("KeycloakId cannot be null");
            throw new ServiceException("40000001", "KeycloakId cannot be null", 
                    ErrorConstant.CATEGORY.BV, ErrorConstant.SEVERITY.I, HttpStatus.BAD_REQUEST);
        }
        // Try to find user by keycloakId (which is the @Id field)
        UserDocument currentUser = userElasticsearchRepository.findById(keycloakId)
                .orElse(null);
        
        // Fallback: try the custom method if findById doesn't work
        if (currentUser == null) {
            currentUser = userElasticsearchRepository.getUserProfileByKeycloakId(keycloakId)
                    .orElse(null);
        }
        
        if (currentUser == null) {
            log.warn("User not found in Elasticsearch for keycloakId: {}. User may need to be synced to Elasticsearch.", keycloakId);
            return Collections.emptyList();
        }
        
        log.debug("Finding matches for user: {}, skills offered: {}, skills wanted: {}", 
                currentUser.getKeycloakId(), currentUser.getSkillsOffered(), currentUser.getSkillsWanted());
        
        // If skills are empty, try to re-sync the user from user service
        List<String> myOffered = currentUser.getSkillsOffered() != null 
                ? currentUser.getSkillsOffered().stream()
                        .filter(s -> s != null && !s.trim().isEmpty())
                        .collect(Collectors.toList())
                : Collections.emptyList();
        List<String> myWanted = currentUser.getSkillsWanted() != null 
                ? currentUser.getSkillsWanted().stream()
                        .filter(s -> s != null && !s.trim().isEmpty())
                        .collect(Collectors.toList())
                : Collections.emptyList();
        
        if (myOffered.isEmpty() && myWanted.isEmpty()) {
            log.warn("User found in Elasticsearch but has no skills. Attempting to re-sync from user service...");
            try {
                userSyncService.syncUser(keycloakId);
                // Re-fetch the user after sync
                currentUser = userElasticsearchRepository.findById(keycloakId)
                        .orElse(null);
                if (currentUser == null) {
                    currentUser = userElasticsearchRepository.getUserProfileByKeycloakId(keycloakId)
                            .orElse(null);
                }
                if (currentUser != null) {
                    log.info("Re-synced user. New skills offered: {}, skills wanted: {}", 
                            currentUser.getSkillsOffered(), currentUser.getSkillsWanted());
                    // Re-calculate skills after sync
                    myOffered = currentUser.getSkillsOffered() != null 
                            ? currentUser.getSkillsOffered().stream()
                                    .filter(s -> s != null && !s.trim().isEmpty())
                                    .collect(Collectors.toList())
                            : Collections.emptyList();
                    myWanted = currentUser.getSkillsWanted() != null 
                            ? currentUser.getSkillsWanted().stream()
                                    .filter(s -> s != null && !s.trim().isEmpty())
                                    .collect(Collectors.toList())
                            : Collections.emptyList();
                }
            } catch (Exception e) {
                log.error("Error re-syncing user: {}", e.getMessage(), e);
            }
        }

        Set<UUID> matchedUserIds = matchHistoryRepository.findAll().stream()
                .filter(mh -> mh.getUser1Id().equals(keycloakId) || mh.getUser2Id().equals(keycloakId))
                .map(mh -> mh.getUser1Id().equals(keycloakId) ? mh.getUser2Id() : mh.getUser1Id())
                .collect(Collectors.toSet());

        // Get all swiped users (both left and right) to exclude them from matches
        List<UUID> allSwipedUserIds = swipeHistoryRepository.findByUserId(keycloakId)
                .stream()
                .map(SwipeHistory::getSwipedUserId)
                .collect(Collectors.toList());
        
        log.debug("Excluding {} already matched users and {} already swiped users", 
                matchedUserIds.size(), allSwipedUserIds.size());

        // Return empty list if no skills to match
        if (myOffered.isEmpty() && myWanted.isEmpty()) {
            log.warn("User has no skills (both offered and wanted are empty). Cannot find matches. User should add skills to their profile.");
            return Collections.emptyList();
        }

        // Build list of FieldValues for each non-empty skill list
        List<FieldValue> wantedFieldValues = myWanted.stream()
                .map(FieldValue::of)
                .collect(Collectors.toList());
        List<FieldValue> offeredFieldValues = myOffered.stream()
                .map(FieldValue::of)
                .collect(Collectors.toList());

        NativeQuery query;
        
        // Build query based on available skills
        if (!wantedFieldValues.isEmpty() && !offeredFieldValues.isEmpty()) {
            // Both lists have values - use OR query
            query = NativeQuery.builder()
                    .withQuery(q -> q.bool(b -> b
                            .should(s -> s.terms(t -> t
                                    .field("skillsOffered")
                                    .terms(v -> v.value(wantedFieldValues))))
                            .should(s -> s.terms(t -> t
                                    .field("skillsWanted")
                                    .terms(v -> v.value(offeredFieldValues))))
                            .minimumShouldMatch("1")))
                    .withPageable(PageRequest.of(0, 200))
                    .build();
        } else if (!wantedFieldValues.isEmpty()) {
            // Only wanted skills - match against others' offered skills
            query = NativeQuery.builder()
                    .withQuery(q -> q.terms(t -> t
                            .field("skillsOffered")
                            .terms(v -> v.value(wantedFieldValues))))
                    .withPageable(PageRequest.of(0, 200))
                    .build();
        } else if (!offeredFieldValues.isEmpty()) {
            // Only offered skills - match against others' wanted skills
            query = NativeQuery.builder()
                    .withQuery(q -> q.terms(t -> t
                            .field("skillsWanted")
                            .terms(v -> v.value(offeredFieldValues))))
                    .withPageable(PageRequest.of(0, 200))
                    .build();
        } else {
            // No skills - return empty (shouldn't reach here due to earlier check)
            return Collections.emptyList();
        }

        log.debug("Executing Elasticsearch query - Wanted skills: {}, Offered skills: {}", myWanted, myOffered);
        
        SearchHits<UserDocument> hits;
        try {
            hits = elasticsearchOperations.search(query, UserDocument.class);
            log.debug("Elasticsearch query returned {} total results", hits.getTotalHits());
        } catch (Exception e) {
            log.error("Error executing Elasticsearch query: {}", e.getMessage(), e);
            return Collections.emptyList();
        }

        List<UserDocument> candidates = hits.getSearchHits().stream()
                .map(SearchHit::getContent)
                .toList();
        
        log.debug("Found {} candidate matches before filtering", candidates.size());
        
        if (candidates.isEmpty()) {
            log.debug("No candidates found from Elasticsearch query. Checking if users exist in index...");
            // Try a simple match_all query to see if there are any users at all
            try {
                NativeQuery allUsersQuery = NativeQuery.builder()
                        .withQuery(q -> q.matchAll(m -> m))
                        .withPageable(PageRequest.of(0, 10))
                        .build();
                SearchHits<UserDocument> allHits = elasticsearchOperations.search(allUsersQuery, UserDocument.class);
                log.debug("Total users in Elasticsearch index: {}", allHits.getTotalHits());
                if (allHits.getTotalHits() == 0) {
                    log.warn("No users found in Elasticsearch. Users may need to be synced.");
                }
            } catch (Exception e) {
                log.error("Error checking total users: {}", e.getMessage(), e);
            }
        }

        UserDocument finalCurrentUser = currentUser;
        UserDocument finalCurrentUser1 = currentUser;
        List<UserDocument> filtered = candidates.stream()
                .filter(u-> !u.getKeycloakId().equals(finalCurrentUser.getKeycloakId()))
                .filter(u -> !matchedUserIds.contains(u.getKeycloakId()))
                .filter(u -> !allSwipedUserIds.contains(u.getKeycloakId()))
                .map(c->Map.entry(c, scoreMatch(finalCurrentUser1, c)))
                .sorted((a,b)-> Double.compare((Double)b.getValue(), (Double)a.getValue()))
                .limit(20)
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
        
        log.debug("Returning {} matches after filtering and scoring", filtered.size());
        
        return filtered;
    }


    private Double scoreMatch(UserDocument user, UserDocument candidate) {
        double score = 0.0;
        
        // Handle null safety
        List<String> userOfferedList = user.getSkillsOffered() != null ? user.getSkillsOffered() : Collections.emptyList();
        List<String> userWantedList = user.getSkillsWanted() != null ? user.getSkillsWanted() : Collections.emptyList();
        List<String> candidateOfferedList = candidate.getSkillsOffered() != null ? candidate.getSkillsOffered() : Collections.emptyList();
        List<String> candidateWantedList = candidate.getSkillsWanted() != null ? candidate.getSkillsWanted() : Collections.emptyList();
        
        Set<String> userOffered = new HashSet<>(userOfferedList);
        Set<String> userWanted = new HashSet<>(userWantedList);
        Set<String> candidateOffered = new HashSet<>(candidateOfferedList);
        Set<String> candidateWanted = new HashSet<>(candidateWantedList);

        for(String skill : userWanted){
            if(candidateOffered.contains(skill)){
                score += 10;
            }
        }

        for(String skill : candidateWanted){
            if(userOffered.contains(skill)){
                score += 5;
            }
        }

        return score;
    }

    @Transactional(readOnly = true)
    public Long getMatchesCount() {
        return matchHistoryRepository.count();
    }

    @Transactional(readOnly = true)
    public List<com.bartr.matching.response.MatchHistoryResponse> getMatchHistory(UUID keycloakId) {
        if (keycloakId == null) {
            log.error("KeycloakId cannot be null");
            throw new ServiceException("40000001", "KeycloakId cannot be null", 
                    ErrorConstant.CATEGORY.BV, ErrorConstant.SEVERITY.I, HttpStatus.BAD_REQUEST);
        }
        log.debug("Fetching match history for user: {}", keycloakId);
        
        // Use the custom query method which is more reliable
        List<com.bartr.matching.domain.entity.MatchHistory> matches = matchHistoryRepository.findAllMatchesForUser(keycloakId);
        log.debug("Found {} matches using findAllMatchesForUser", matches.size());
        
        // Fallback: if custom query returns nothing, try the original method
        if (matches.isEmpty()) {
            log.debug("No matches found with custom query. Trying findByUser1IdOrUser2Id...");
            matches = matchHistoryRepository.findByUser1IdOrUser2Id(keycloakId, keycloakId);
            log.debug("Found {} matches using findByUser1IdOrUser2Id", matches.size());
        }
        
        // If still no matches found, check all matches in database for debugging
        if (matches.isEmpty()) {
            log.debug("No matches found with repository methods. Checking all matches in database...");
            List<com.bartr.matching.domain.entity.MatchHistory> allMatches = matchHistoryRepository.findAll();
            log.debug("Total matches in database: {}", allMatches.size());
            
            // Filter manually to see if there's a query issue
            List<com.bartr.matching.domain.entity.MatchHistory> manualFilter = allMatches.stream()
                    .filter(m -> m.getUser1Id().equals(keycloakId) || m.getUser2Id().equals(keycloakId))
                    .collect(Collectors.toList());
            log.debug("Manual filter found {} matches for user {}", manualFilter.size(), keycloakId);
            
            if (!manualFilter.isEmpty()) {
                log.debug("Using manually filtered matches instead");
                matches = manualFilter;
            }
        }
        
        if (matches.isEmpty()) {
            log.debug("No matches found for user: {}", keycloakId);
            return Collections.emptyList();
        }
        
        log.debug("Processing {} matches...", matches.size());
        
        return matches.stream().map(match -> {
            // Determine the other user's ID
            UUID otherUserId = match.getUser1Id().equals(keycloakId) ? match.getUser2Id() : match.getUser1Id();
            log.debug("Processing match: user1={}, user2={}, otherUserId={}", 
                    match.getUser1Id(), match.getUser2Id(), otherUserId);
            
            // Fetch the other user's profile from user service
            com.bartr.matching.response.UserProfileDto otherUserProfile = null;
            try {
                log.debug("Fetching user profile for: {}", otherUserId);
                otherUserProfile = userServiceClient.getUserProfileByKeycloakId(otherUserId);
                log.debug("Successfully fetched profile for: {} - {}", 
                        otherUserId, otherUserProfile != null ? 
                        otherUserProfile.getFirstName() + " " + otherUserProfile.getLastName() : "null");
            } catch (Exception e) {
                log.error("Error fetching user profile for {}: {}", otherUserId, e.getMessage(), e);
            }
            
            com.bartr.matching.response.MatchHistoryResponse response = com.bartr.matching.response.MatchHistoryResponse.builder()
                    .user1Id(match.getUser1Id())
                    .user2Id(match.getUser2Id())
                    .matchedDate(match.getMatchedDate())
                    .otherUser(otherUserProfile)
                    .build();
            
            return response;
        }).collect(Collectors.toList());
    }

    @Transactional
    public void unmatch(UUID user1Id, UUID user2Id) {
        if (user1Id == null || user2Id == null) {
            log.error("Cannot unmatch: user1Id or user2Id is null");
            throw new ServiceException("40000002", "Both user IDs are required for unmatch", 
                    ErrorConstant.CATEGORY.BV, ErrorConstant.SEVERITY.I, HttpStatus.BAD_REQUEST);
        }
        
        if (user1Id.equals(user2Id)) {
            log.error("Cannot unmatch: user1Id and user2Id are the same");
            throw new ServiceException("40000003", "Cannot unmatch a user with themselves", 
                    ErrorConstant.CATEGORY.BV, ErrorConstant.SEVERITY.I, HttpStatus.BAD_REQUEST);
        }
        
        log.info("Unmatching users: user1Id={}, user2Id={}", user1Id, user2Id);
        
        // Try to find match in both directions (user1-user2 or user2-user1)
        Optional<com.bartr.matching.domain.entity.MatchHistory> match1 = 
                matchHistoryRepository.findByUser1IdAndUser2Id(user1Id, user2Id);
        Optional<com.bartr.matching.domain.entity.MatchHistory> match2 = 
                matchHistoryRepository.findByUser1IdAndUser2Id(user2Id, user1Id);
        
        com.bartr.matching.domain.entity.MatchHistory matchToDelete = null;
        if (match1.isPresent()) {
            matchToDelete = match1.get();
        } else if (match2.isPresent()) {
            matchToDelete = match2.get();
        }
        
        if (matchToDelete == null) {
            log.warn("No match found between users: user1Id={}, user2Id={}", user1Id, user2Id);
            throw new ServiceException("40400001", "No match found between the specified users", 
                    ErrorConstant.CATEGORY.BV, ErrorConstant.SEVERITY.I, HttpStatus.NOT_FOUND);
        }
        
        matchHistoryRepository.delete(matchToDelete);
        log.info("Successfully unmatched users: user1Id={}, user2Id={}", user1Id, user2Id);
    }
}
