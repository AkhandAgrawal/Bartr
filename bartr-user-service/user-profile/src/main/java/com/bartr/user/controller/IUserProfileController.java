package com.bartr.user.controller;

import com.bartr.user.ApiResponse;
import com.bartr.user.domain.entities.UserProfile;
import com.bartr.user.request.SignupRequest;
import com.bartr.user.request.UpdateRequest;
import jakarta.validation.Valid;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import org.springframework.security.core.annotation.AuthenticationPrincipal;

import java.util.List;
import java.util.UUID;

@RequestMapping("/v1/user/profile")
public interface IUserProfileController {
    @GetMapping
    public ResponseEntity<UserProfile> getUserProfileByKeycloakId(@RequestParam(name = "keycloakId") UUID keycloakId);

    @GetMapping("/all")
    public ResponseEntity<Page<UserProfile>> getAllUserProfiles(Pageable pageable);

    @GetMapping("/me")
    public UserProfile getUserProfile(@AuthenticationPrincipal Jwt jwt);

    @GetMapping("/skills")
    public List<UserProfile> getUsersBasedOnSkill(@RequestParam(name = "skill") String skill);

    @PostMapping("/signup/public")
    public UserProfile createUserProfile(@Valid @RequestBody SignupRequest request);

    @PutMapping("/update")
    public UserProfile updateUserProfile(@Valid @RequestBody UpdateRequest request, @AuthenticationPrincipal Jwt jwt);

    @DeleteMapping("/delete")
    public ResponseEntity<ApiResponse<Void>> deleteUserProfile(@RequestParam(name = "keycloakId") String keycloakId);

    @GetMapping("/test")
    public String testEndpoint();

    @GetMapping("/stats/active-users")
    public Long getActiveUsersCount();

    @PostMapping("/credits/add")
    public ResponseEntity<UserProfile> addCredits(@RequestParam(name = "keycloakId") UUID keycloakId, @RequestParam(name = "amount") int amount);
}
