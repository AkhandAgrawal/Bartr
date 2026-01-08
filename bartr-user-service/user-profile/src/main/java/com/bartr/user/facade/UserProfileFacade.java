package com.bartr.user.facade;

import com.bartr.user.application.service.UserProfileService;
import com.bartr.user.domain.entities.UserProfile;
import com.bartr.user.request.SignupRequest;
import com.bartr.user.request.UpdateRequest;
import lombok.AllArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.UUID;

@Component
@AllArgsConstructor
public class UserProfileFacade {

    UserProfileService userProfileService;

    public UserProfile getUserProfileByKeycloakId(UUID keycloakId) {
        return userProfileService.getUserProfileByKeycloakId(keycloakId);
    }

    public UserProfile getUserProfile(Jwt jwt) {
        return userProfileService.getUserProfile(jwt);
    }

    public UserProfile createUserProfile(SignupRequest request) {
        return userProfileService.createUserProfile(request);
    }

    public UserProfile updateUserProfile(UpdateRequest request,Jwt jwt) {
        return userProfileService.updateUserProfile(request, jwt);
    }

    public List<UserProfile> getUsersBasedOnSkill(String skill) {
        return userProfileService.getUsersBasedOnSkill(skill);
    }

    public void deleteUserProfileById(String keycloakId) {
        userProfileService.deleteUserProfileById(keycloakId);
    }

    public Page<UserProfile> getAllUserProfiles(Pageable pageable) {
        return userProfileService.getAllUserProfiles(pageable);
    }

    public Long getActiveUsersCount() {
        return userProfileService.getActiveUsersCount();
    }

    public UserProfile addCredits(UUID keycloakId, int amount) {
        return userProfileService.addCredits(keycloakId, amount);
    }
}
