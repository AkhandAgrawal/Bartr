package com.bartr.user.application.service;

import com.bartr.user.ErrorMessages;
import com.bartr.user.application.utility.ExceptionUtility;
import com.bartr.user.application.utility.Helper;
import com.bartr.user.domain.entities.SkillsOffered;
import com.bartr.user.domain.entities.SkillsWanted;
import com.bartr.user.domain.entities.UserProfile;
import com.bartr.user.domain.repositories.SkillOfferedRepository;
import com.bartr.user.domain.repositories.UserProfileRepository;
import com.bartr.user.request.SignupRequest;
import com.bartr.user.request.UpdateRequest;
import jakarta.ws.rs.core.Response;
import java.util.ArrayList;
import lombok.extern.slf4j.Slf4j;
import org.keycloak.admin.client.Keycloak;
import org.keycloak.representations.idm.CredentialRepresentation;
import org.keycloak.representations.idm.UserRepresentation;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Slf4j
@Service
public class UserProfileService {

    private final ExceptionUtility exceptionUtility;
    private final UserProfileRepository userProfileRepository;
    private final Keycloak keycloak;
    private final SkillOfferedRepository skillOfferedRepository;
    private final Helper helper;

    @Autowired
    public UserProfileService(ExceptionUtility exceptionUtility,
                            UserProfileRepository userProfileRepository,
                            Keycloak keycloak,
                            SkillOfferedRepository skillOfferedRepository,
                            Helper helper) {
        this.exceptionUtility = exceptionUtility;
        this.userProfileRepository = userProfileRepository;
        this.keycloak = keycloak;
        this.skillOfferedRepository = skillOfferedRepository;
        this.helper = helper;
    }

    @Value("${keycloak.realm}")
    private String realm;

    @Transactional(readOnly = true)
    public UserProfile getUserProfileByKeycloakId(UUID keycloakId) {
        Optional<UserProfile> profileOpt = userProfileRepository.findByKeycloakId(keycloakId);
        if (profileOpt.isEmpty()) {
            throw exceptionUtility.createServiceException(ErrorMessages.USER_PROFILE_NOT_FOUND);
        }
        
        UserProfile userProfile = profileOpt.get();
        
        // Fetch skills separately to avoid MultipleBagFetchException
        // First fetch with skills offered
        Optional<UserProfile> profileWithOffered = userProfileRepository.findByKeycloakIdWithSkillsOffered(keycloakId);
        if (profileWithOffered.isPresent()) {
            userProfile.setSkillsOffered(profileWithOffered.get().getSkillsOffered());
        }
        
        // Then fetch with skills wanted
        Optional<UserProfile> profileWithWanted = userProfileRepository.findByKeycloakIdWithSkillsWanted(keycloakId);
        if (profileWithWanted.isPresent()) {
            userProfile.setSkillsWanted(profileWithWanted.get().getSkillsWanted());
        }
        
        return userProfile;
    }

    @Transactional(readOnly = true)
    public UserProfile getUserProfile(Jwt jwt) {
        return userProfileRepository.findByKeycloakId(UUID.fromString(jwt.getSubject()))
                .orElseThrow(() -> exceptionUtility.createServiceException(ErrorMessages.USER_PROFILE_NOT_FOUND));
    }

    @Transactional
    public UserProfile createUserProfile(SignupRequest request) {
        if (request == null) {
            throw exceptionUtility.createServiceException(ErrorMessages.INVALID_REQUEST, "SignupRequest cannot be null");
        }
        UUID keycloakId = createUserInKeycloak(request);

        return createUserInDb(request, keycloakId);
    }

    private UUID createUserInKeycloak(SignupRequest request){

        UserRepresentation user = new UserRepresentation();
        user.setUsername(request.getUserName());
        user.setFirstName(request.getFirstName());
        user.setLastName(request.getLastName());
        user.setEmail(request.getEmail());
        user.setEnabled(true);
        Map<String, List<String>> attributes = new HashMap<>();
        attributes.put("gender", Collections.singletonList(request.getGender()));
        user.setAttributes(attributes);

        CredentialRepresentation credential = new CredentialRepresentation();
        credential.setType(CredentialRepresentation.PASSWORD);
        credential.setValue(request.getPassword());
        credential.setTemporary(false);

        user.setCredentials(List.of(credential));

        String userId;
        try{
            Response response = keycloak.realm(realm).users().create(user);
            String location = response.getHeaderString("Location");
            userId = location.substring(location.lastIndexOf("/")+1);
        } catch (Exception e) {
            throw exceptionUtility.createServiceException(ErrorMessages.KEYCLOAK_USER_CREATION_FAILED);
        }
        return UUID.fromString(userId);
    }

    private UserProfile createUserInDb(SignupRequest request, UUID keycloakId){
        UserProfile userProfile = new UserProfile();
        userProfile.setKeycloakId(keycloakId);
        userProfile.setFirstName(request.getFirstName());
        userProfile.setLastName(request.getLastName());
        userProfile.setGender(request.getGender());
        userProfile.setUserName(request.getUserName());
        userProfile.setBio(request.getBio());
        userProfile.setCredits(0);
        userProfile.setEmail(request.getEmail());

        List<SkillsOffered> skillsOffered = helper.stringListToSkillOfferedList(request.getSkillsOffered(), userProfile);
        List<SkillsWanted> skillsWanted = helper.stringListToSkillWantedList(request.getSkillsWanted(),userProfile);

        userProfile.setSkillsOffered(skillsOffered);
        userProfile.setSkillsWanted(skillsWanted);
        return userProfileRepository.save(userProfile);
    }

    @Transactional
    public UserProfile updateUserProfile(UpdateRequest request, Jwt jwt) {
        UUID keycloakId = UUID.fromString(jwt.getSubject());
        
        // Update Keycloak user
        updateUserProfileInKeycloak(request, jwt);

        // Fetch existing user profile
        UserProfile userProfile = userProfileRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> exceptionUtility.createServiceException(ErrorMessages.USER_PROFILE_NOT_FOUND));

        // Update basic fields
        if (request.getUserName() != null) {
            userProfile.setUserName(request.getUserName());
        }
        if (request.getBio() != null) {
            userProfile.setBio(request.getBio());
        }
        if (request.getFirstName() != null) {
            userProfile.setFirstName(request.getFirstName());
        }
        if (request.getLastName() != null) {
            userProfile.setLastName(request.getLastName());
        }
        if (request.getGender() != null) {
            userProfile.setGender(request.getGender());
        }
        if (request.getEmail() != null) {
            userProfile.setEmail(request.getEmail());
        }

        // Update skills if provided
        if (request.getSkillsOffered() != null && !request.getSkillsOffered().isEmpty()) {
            // Properly handle cascade by removing old items first, then adding new ones
            if (userProfile.getSkillsOffered() != null) {
                // Create a copy to avoid concurrent modification
                List<SkillsOffered> toRemove = new ArrayList<>(userProfile.getSkillsOffered());
                userProfile.getSkillsOffered().removeAll(toRemove);
            }
            List<SkillsOffered> skillsOffered = helper.stringListToSkillOfferedList(request.getSkillsOffered(), userProfile);
            if (userProfile.getSkillsOffered() == null) {
                userProfile.setSkillsOffered(new ArrayList<>());
            }
            userProfile.getSkillsOffered().addAll(skillsOffered);
        }
        
        if (request.getSkillsWanted() != null && !request.getSkillsWanted().isEmpty()) {
            // Properly handle cascade by removing old items first, then adding new ones
            if (userProfile.getSkillsWanted() != null) {
                // Create a copy to avoid concurrent modification
                List<SkillsWanted> toRemove = new ArrayList<>(userProfile.getSkillsWanted());
                userProfile.getSkillsWanted().removeAll(toRemove);
            }
            List<SkillsWanted> skillsWanted = helper.stringListToSkillWantedList(request.getSkillsWanted(), userProfile);
            if (userProfile.getSkillsWanted() == null) {
                userProfile.setSkillsWanted(new ArrayList<>());
            }
            userProfile.getSkillsWanted().addAll(skillsWanted);
        }

        return userProfileRepository.save(userProfile);
    }

    private void updateUserProfileInKeycloak(UpdateRequest request, Jwt jwt){
        String userId = jwt.getSubject();

        try{
            UserRepresentation user = keycloak.realm(realm).users().get(userId).toRepresentation();

            if (request.getUserName() != null) {
                user.setUsername(request.getUserName());
            }
            if (request.getFirstName() != null) {
                user.setFirstName(request.getFirstName());
            }
            if (request.getLastName() != null) {
                user.setLastName(request.getLastName());
            }
            if (request.getEmail() != null) {
                user.setEmail(request.getEmail());
            }

            keycloak.realm(realm).users().get(userId).update(user);
        }
        catch (Exception e){
            log.warn("Failed to update Keycloak user: {}", e.getMessage(), e);
            // Continue with database update even if Keycloak update fails
        }
    }


    @Transactional(readOnly = true)
    public List<UserProfile> getUsersBasedOnSkill(String skill) {
        if (skill == null || skill.trim().isEmpty()) {
            throw exceptionUtility.createServiceException(ErrorMessages.INVALID_REQUEST, "Skill cannot be null or empty");
        }
        List<SkillsOffered> skillsOfferedList = skillOfferedRepository.findBySkillName(skill);

        return skillsOfferedList.stream().map(SkillsOffered::getUserProfile).toList();
    }

    @Transactional
    public void deleteUserProfileById(String keycloakId) {

        deleteUserFromKeycloak(keycloakId);

        UserProfile userProfile = userProfileRepository.findByKeycloakId(UUID.fromString(keycloakId))
                .orElseThrow(() -> exceptionUtility.createServiceException(ErrorMessages.USER_PROFILE_NOT_FOUND));

        userProfile.getSkillsOffered().clear();
        userProfile.getSkillsWanted().clear();

        userProfileRepository.saveAndFlush(userProfile);

        userProfileRepository.delete(userProfile);
    }

    private void deleteUserFromKeycloak(String keycloakId) {
        try {
            keycloak.realm(realm).users().delete(keycloakId);
        } catch (Exception e) {
            throw exceptionUtility.createServiceException(ErrorMessages.KEYCLOAK_USER_DELETE_FAILED);
        }
    }

    @Transactional(readOnly = true)
    public Page<UserProfile> getAllUserProfiles(Pageable pageable) {
        if (pageable == null) {
            throw exceptionUtility.createServiceException(ErrorMessages.INVALID_REQUEST, "Pageable cannot be null");
        }
        return new PageImpl<>(userProfileRepository.findAll(pageable).stream()
                .collect(Collectors.toList()),
                pageable,
                userProfileRepository.findAll(pageable).getTotalElements());
    }

    @Transactional(readOnly = true)
    public Long getActiveUsersCount() {
        return userProfileRepository.count();
    }

    @Transactional
    public UserProfile addCredits(UUID keycloakId, int amount) {
        if (keycloakId == null) {
            throw exceptionUtility.createServiceException(ErrorMessages.INVALID_REQUEST, "KeycloakId cannot be null");
        }
        if (amount < 0) {
            throw exceptionUtility.createServiceException(ErrorMessages.INVALID_REQUEST, "Credit amount cannot be negative");
        }
        UserProfile userProfile = getUserProfileByKeycloakId(keycloakId);
        userProfile.setCredits(userProfile.getCredits() + amount);
        return userProfileRepository.save(userProfile);
    }
}
