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
        UserDocument currentUser = null;
        try {
            currentUser = userElasticsearchRepository.findById(keycloakId)
                    .orElse(null);

            // Fallback: try the custom method if findById doesn't work
            if (currentUser == null) {
                currentUser = userElasticsearchRepository.getUserProfileByKeycloakId(keycloakId)
                        .orElse(null);
            }
        } catch (Exception e) {
            log.warn("Elasticsearch is not reachable when fetching current user. Will fetch from User Service: {}", e.getMessage());
        }

        // If user not found in Elasticsearch, fetch from User Service
        if (currentUser == null) {
            log.info("User not found in Elasticsearch. Fetching from User Service for keycloakId: {}", keycloakId);
            try {
                com.bartr.matching.response.UserProfileDto userDto = userServiceClient.getUserProfileByKeycloakId(keycloakId);
                if (userDto != null) {
                    currentUser = convertToUserDocument(userDto);
                    log.info("Successfully fetched user from User Service");
                } else {
                    log.warn("User not found in User Service for keycloakId: {}", keycloakId);
                    return Collections.emptyList();
                }
            } catch (Exception e) {
                log.error("Error fetching user from User Service: {}", e.getMessage(), e);
                return Collections.emptyList();
            }
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

        List<UserDocument> candidates;
        try {
            SearchHits<UserDocument> hits = elasticsearchOperations.search(query, UserDocument.class);
            log.debug("Elasticsearch query returned {} total results", hits.getTotalHits());
            candidates = hits.getSearchHits().stream()
                    .map(SearchHit::getContent)
                    .toList();
            log.debug("Found {} candidate matches from Elasticsearch", candidates.size());
        } catch (Exception e) {
            log.warn("Elasticsearch is not reachable: {}. Falling back to database query.", e.getMessage());
            log.debug("Elasticsearch error details:", e);

            // Fallback to database: fetch users from User Service
            try {
                candidates = findMatchesFromDatabase(keycloakId, myOffered, myWanted, matchedUserIds, allSwipedUserIds);
                log.info("Database fallback returned {} potential matches", candidates.size());
            } catch (Exception dbException) {
                log.error("Error fetching matches from database fallback: {}", dbException.getMessage(), dbException);
                return Collections.emptyList();
            }
        }

        if (candidates.isEmpty() && currentUser != null) {
            log.debug("No candidates found. Checking if Elasticsearch is accessible...");
            // Try a simple match_all query to see if Elasticsearch is accessible
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
                log.debug("Elasticsearch is not accessible for health check: {}", e.getMessage());
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


    /**
     * Fallback method to find matches from database when Elasticsearch is not reachable.
     * Fetches all users from User Service and filters them based on skills matching.
     */
    private List<UserDocument> findMatchesFromDatabase(
            UUID keycloakId,
            List<String> myOffered,
            List<String> myWanted,
            Set<UUID> matchedUserIds,
            List<UUID> allSwipedUserIds) {

        log.info("Fetching potential matches from database (User Service)");

        try {
            // Fetch all users from User Service in batches
            List<com.bartr.matching.response.UserProfileDto> allUsers = new ArrayList<>();
            int page = 0;
            int pageSize = 100;
            boolean hasMore = true;

            while (hasMore) {
                org.springframework.data.domain.Pageable pageable = PageRequest.of(page, pageSize);
                org.springframework.data.domain.Page<com.bartr.matching.response.UserProfileDto> userPage =
                        userServiceClient.getAllUsers(pageable);

                if (userPage != null && userPage.hasContent()) {
                    allUsers.addAll(userPage.getContent());
                    hasMore = userPage.hasNext();
                    page++;
                    log.debug("Fetched page {} with {} users. Total so far: {}",
                            page, userPage.getContent().size(), allUsers.size());
                } else {
                    hasMore = false;
                }
            }

            log.info("Fetched {} total users from User Service", allUsers.size());

            // Convert UserProfileDto to UserDocument and filter
            List<UserDocument> candidates = allUsers.stream()
                    .filter(user -> !user.getKeycloakId().equals(keycloakId)) // Exclude current user
                    .filter(user -> !matchedUserIds.contains(user.getKeycloakId())) // Exclude already matched
                    .filter(user -> !allSwipedUserIds.contains(user.getKeycloakId())) // Exclude already swiped
                    .map(this::convertToUserDocument)
                    .filter(userDoc -> hasMatchingSkills(userDoc, myOffered, myWanted)) // Filter by skills
                    .collect(Collectors.toList());

            log.info("Found {} potential matches after filtering by skills", candidates.size());
            return candidates;

        } catch (Exception e) {
            log.error("Error fetching users from User Service for database fallback: {}", e.getMessage(), e);
            throw new ServiceException("50000003", "Failed to fetch matches from database: " + e.getMessage(),
                    ErrorConstant.CATEGORY.TS, ErrorConstant.SEVERITY.C, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    /**
     * Convert UserProfileDto to UserDocument for matching logic compatibility.
     */
    private UserDocument convertToUserDocument(com.bartr.matching.response.UserProfileDto dto) {
        List<String> skillsOffered = dto.getSkillsOffered() != null
                ? dto.getSkillsOffered().stream()
                .map(com.bartr.matching.response.SkillsOfferedDto::getSkillName)
                .filter(s -> s != null && !s.trim().isEmpty())
                .collect(Collectors.toList())
                : Collections.emptyList();

        List<String> skillsWanted = dto.getSkillsWanted() != null
                ? dto.getSkillsWanted().stream()
                .map(com.bartr.matching.response.SkillsWantedDto::getSkillName)
                .filter(s -> s != null && !s.trim().isEmpty())
                .collect(Collectors.toList())
                : Collections.emptyList();

        return UserDocument.builder()
                .keycloakId(dto.getKeycloakId())
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .gender(dto.getGender())
                .skillsOffered(skillsOffered)
                .skillsWanted(skillsWanted)
                .email(dto.getEmail())
                .userName(dto.getUserName())
                .build();
    }

    /**
     * Check if a user document has matching skills with the current user's requirements.
     */
    private boolean hasMatchingSkills(UserDocument candidate, List<String> myOffered, List<String> myWanted) {
        if (candidate.getSkillsOffered() == null && candidate.getSkillsWanted() == null) {
            return false;
        }

        List<String> candidateOffered = candidate.getSkillsOffered() != null
                ? candidate.getSkillsOffered()
                : Collections.emptyList();
        List<String> candidateWanted = candidate.getSkillsWanted() != null
                ? candidate.getSkillsWanted()
                : Collections.emptyList();

        // Check if candidate offers any skill I want
        if (!myWanted.isEmpty() && !candidateOffered.isEmpty()) {
            boolean hasMatch = myWanted.stream().anyMatch(candidateOffered::contains);
            if (hasMatch) return true;
        }

        // Check if candidate wants any skill I offer
        if (!myOffered.isEmpty() && !candidateWanted.isEmpty()) {
            boolean hasMatch = myOffered.stream().anyMatch(candidateWanted::contains);
            if (hasMatch) return true;
        }

        return false;
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
