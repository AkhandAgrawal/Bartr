package com.bartr.matching.controller.impl;

import com.bartr.matching.UserDocument;
import com.bartr.matching.application.service.MatchingService;
import com.bartr.matching.application.service.SwipeService;
import com.bartr.matching.application.service.UserSyncService;
import com.bartr.matching.controller.IMatchingController;
import com.bartr.matching.request.SwipeRequest;
import com.bartr.matching.response.SwipeResponse;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@AllArgsConstructor
public class MatchingController implements IMatchingController {

    private MatchingService matchingService;
    private SwipeService swipeService;
    private UserSyncService userSyncService;

    @Override
    public List<UserDocument> getPersonalizedProfiles(UUID keycloakId){
        return matchingService.findTopMatches(keycloakId);
    }

    @Override
    public SwipeResponse swipe(@Valid SwipeRequest request) {
        return swipeService.swipe(request);
    }

    @Override
    public Long getMatchesCount() {
        return matchingService.getMatchesCount();
    }

    @Override
    public String syncUser(UUID keycloakId) {
        try {
            userSyncService.syncUser(keycloakId);
            return "User " + keycloakId + " synced successfully";
        } catch (Exception e) {
            return "Error syncing user " + keycloakId + ": " + e.getMessage();
        }
    }

    @Override
    public List<com.bartr.matching.response.MatchHistoryResponse> getMatchHistory(UUID keycloakId) {
        return matchingService.getMatchHistory(keycloakId);
    }

    @Override
    public void unmatch(UUID user1Id, UUID user2Id) {
        matchingService.unmatch(user1Id, user2Id);
    }
}
