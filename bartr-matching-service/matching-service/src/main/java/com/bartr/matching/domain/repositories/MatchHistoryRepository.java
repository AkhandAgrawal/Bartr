package com.bartr.matching.domain.repositories;

import com.bartr.matching.domain.entity.MatchHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface MatchHistoryRepository extends JpaRepository<MatchHistory, Long> {

    Optional<MatchHistory> findByUser1IdAndUser2Id(UUID user1Id, UUID user2Id);
    boolean existsByUser1IdAndUser2Id(UUID user1Id, UUID user2Id);
    List<MatchHistory> findByUser1IdOrUser2Id(UUID user1Id, UUID user2Id);
    
    // Custom query to ensure it works correctly - finds all matches where the user is either user1 or user2
    @Query("SELECT m FROM MatchHistory m WHERE m.user1Id = :userId OR m.user2Id = :userId")
    List<MatchHistory> findAllMatchesForUser(@Param("userId") UUID userId);

}
