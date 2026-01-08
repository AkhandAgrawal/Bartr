package com.bartr.user.controller.impl;

import com.bartr.user.ApiResponse;
import com.bartr.user.SuccessMessages;
import com.bartr.user.controller.IUserProfileController;
import com.bartr.user.domain.entities.UserProfile;
import com.bartr.user.facade.UserProfileFacade;
import com.bartr.user.request.UpdateRequest;
import com.bartr.user.request.SignupRequest;
import jakarta.validation.Valid;
import lombok.AllArgsConstructor;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@AllArgsConstructor
public class UserProfileController implements IUserProfileController {

    @Autowired
    UserProfileFacade userProfileFacade;

    @Override
    public ResponseEntity<UserProfile> getUserProfileByKeycloakId(UUID keycloakId) {
        UserProfile response = userProfileFacade.getUserProfileByKeycloakId(keycloakId);
        return ResponseEntity.ok(response);
    }

    @Override
    public ResponseEntity<Page<UserProfile>> getAllUserProfiles(Pageable pageable) {
        Page<UserProfile> response = userProfileFacade.getAllUserProfiles(pageable);
        return ResponseEntity.ok(response);
    }

    @Override
    public UserProfile getUserProfile(Jwt jwt) {
        return userProfileFacade.getUserProfile(jwt);
    }

    @Override
    public List<UserProfile> getUsersBasedOnSkill(String skill) {
        return userProfileFacade.getUsersBasedOnSkill(skill);
    }

    @Override
    public UserProfile createUserProfile(@Valid SignupRequest request) {
        return userProfileFacade.createUserProfile(request);
    }

    @Override
    public UserProfile updateUserProfile(@Valid UpdateRequest request, Jwt jwt) {
        return userProfileFacade.updateUserProfile(request, jwt);
    }

    @Override
    public ResponseEntity<ApiResponse<Void>> deleteUserProfile(String keycloakId) {
        userProfileFacade.deleteUserProfileById(keycloakId);
        return ApiResponse.success(null, SuccessMessages.DELETED_SUCCESS,"MS_USER_SERVICE");
    }

    @Override
    public String testEndpoint() {
        return "test";
    }

    @Override
    public Long getActiveUsersCount() {
        return userProfileFacade.getActiveUsersCount();
    }

    @Override
    public ResponseEntity<UserProfile> addCredits(UUID keycloakId, int amount) {
        UserProfile response = userProfileFacade.addCredits(keycloakId, amount);
        return ResponseEntity.ok(response);
    }

}
