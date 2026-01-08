package com.bartr.matching.application.service;

import com.bartr.common.core.exception.ErrorConstant;
import com.bartr.common.core.exception.ServiceException;
import com.bartr.matching.UserDocument;
import com.bartr.matching.UserServiceClient;
import com.bartr.matching.domain.repositories.UserElasticsearchRepository;
import com.bartr.matching.response.SkillsOfferedDto;
import com.bartr.matching.response.SkillsWantedDto;
import com.bartr.matching.response.UserProfileDto;
import lombok.AllArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.UUID;

@Slf4j
@Service
@AllArgsConstructor
public class UserSyncService {

    private UserServiceClient userServiceClient;
    private UserElasticsearchRepository userElasticsearchRepository;

    public void syncUsers() {
        log.info("Starting user sync to Elasticsearch...");
        int page = 0;
        Page<UserProfileDto> userPage;
        int totalSynced = 0;

        do {
            Pageable pageable = Pageable.ofSize(100).withPage(page);
            userPage = userServiceClient.getAllUsers(pageable);

            if (!userPage.getContent().isEmpty()) {
                List<UserDocument> documents = userPage.getContent().stream()
                        .map(this::mapToDocument)
                        .toList();
                
                // Log first user's skills for debugging
                if (page == 0 && !documents.isEmpty()) {
                    UserDocument firstDoc = documents.get(0);
                    log.info("Sample user being synced - KeycloakId: {}, Skills Offered: {}, Skills Wanted: {}", 
                            firstDoc.getKeycloakId(), 
                            firstDoc.getSkillsOffered(), 
                            firstDoc.getSkillsWanted());
                }
                
                userElasticsearchRepository.saveAll(documents);
                totalSynced += documents.size();
                log.info("Synced {} users (page {}), total synced so far: {}", documents.size(), page, totalSynced);
            }

            page++;
        } while (userPage.hasNext());
        
        log.info("User sync completed. Total users synced: {}", totalSynced);
    }

    /**
     * Sync a single user by keycloakId. This method uses the getUserProfileByKeycloakId endpoint
     * which should include all skills data.
     */
    public void syncUser(UUID keycloakId) {
        log.info("Syncing single user with keycloakId: {}", keycloakId);
        try {
            UserProfileDto dto = userServiceClient.getUserProfileByKeycloakId(keycloakId);
            if (dto != null) {
                log.info("Retrieved user profile - KeycloakId: {}, Skills Offered DTOs: {}, Skills Wanted DTOs: {}", 
                        dto.getKeycloakId(),
                        dto.getSkillsOffered() != null ? dto.getSkillsOffered().size() : 0,
                        dto.getSkillsWanted() != null ? dto.getSkillsWanted().size() : 0);
                
                UserDocument document = mapToDocument(dto);
                log.info("Mapped to UserDocument - Skills Offered: {}, Skills Wanted: {}", 
                        document.getSkillsOffered(), 
                        document.getSkillsWanted());
                
                UserDocument saved = userElasticsearchRepository.save(document);
                log.info("Successfully synced user {} to Elasticsearch with {} skills offered and {} skills wanted", 
                        saved.getKeycloakId(),
                        saved.getSkillsOffered() != null ? saved.getSkillsOffered().size() : 0,
                        saved.getSkillsWanted() != null ? saved.getSkillsWanted().size() : 0);
            } else {
                log.warn("User profile not found for keycloakId: {}", keycloakId);
            }
        } catch (Exception e) {
            log.error("Error syncing user {}: {}", keycloakId, e.getMessage(), e);
            throw new ServiceException("50000002", "Failed to sync user: " + keycloakId, 
                    ErrorConstant.CATEGORY.TS, ErrorConstant.SEVERITY.C, HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }

    private UserDocument mapToDocument(UserProfileDto dto){
        List<String> skillsWanted = dto.getSkillsWanted() != null 
                ? dto.getSkillsWanted().stream()
                        .map(SkillsWantedDto::getSkillName)
                        .filter(s -> s != null && !s.trim().isEmpty())
                        .toList()
                : Collections.emptyList();
        
        List<String> skillsOffered = dto.getSkillsOffered() != null 
                ? dto.getSkillsOffered().stream()
                        .map(SkillsOfferedDto::getSkillName)
                        .filter(s -> s != null && !s.trim().isEmpty())
                        .toList()
                : Collections.emptyList();
        
        // Log mapping for debugging
        if (dto.getKeycloakId() != null) {
            log.debug("Mapping user {} - DTO has {} skills offered DTOs, {} skills wanted DTOs. Mapped to {} offered, {} wanted", 
                    dto.getKeycloakId(),
                    dto.getSkillsOffered() != null ? dto.getSkillsOffered().size() : 0,
                    dto.getSkillsWanted() != null ? dto.getSkillsWanted().size() : 0,
                    skillsOffered.size(),
                    skillsWanted.size());
        }
        
        return UserDocument.builder()
                .keycloakId(dto.getKeycloakId())
                .firstName(dto.getFirstName())
                .lastName(dto.getLastName())
                .gender(dto.getGender())
                .skillsWanted(skillsWanted)
                .skillsOffered(skillsOffered)
                .email(dto.getEmail())
                .userName(dto.getUserName())
                .build();
    }
}
