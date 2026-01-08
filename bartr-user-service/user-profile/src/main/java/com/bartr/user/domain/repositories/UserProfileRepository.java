package com.bartr.user.domain.repositories;

import com.bartr.user.domain.entities.UserProfile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;
import java.util.UUID;

@Repository
public interface UserProfileRepository extends JpaRepository<UserProfile, Long> {

    // Fetch user profile without collections to avoid MultipleBagFetchException
    @Query("SELECT u FROM UserProfile u WHERE u.keycloakId = :keycloakId")
    Optional<UserProfile> findByKeycloakId(@Param("keycloakId") UUID keycloakId);
    
    // Separate query to fetch skills offered
    @Query("SELECT u FROM UserProfile u LEFT JOIN FETCH u.skillsOffered WHERE u.keycloakId = :keycloakId")
    Optional<UserProfile> findByKeycloakIdWithSkillsOffered(@Param("keycloakId") UUID keycloakId);
    
    // Separate query to fetch skills wanted
    @Query("SELECT u FROM UserProfile u LEFT JOIN FETCH u.skillsWanted WHERE u.keycloakId = :keycloakId")
    Optional<UserProfile> findByKeycloakIdWithSkillsWanted(@Param("keycloakId") UUID keycloakId);
}
