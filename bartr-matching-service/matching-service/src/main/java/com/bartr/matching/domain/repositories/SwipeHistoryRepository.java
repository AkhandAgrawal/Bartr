package com.bartr.matching.domain.repositories;

import com.bartr.matching.domain.entity.SwipeHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface SwipeHistoryRepository extends JpaRepository<SwipeHistory, Long> {
    List<SwipeHistory> findByUserIdAndSwipeDate(UUID userId, LocalDate swipeDate);
    Optional<SwipeHistory> findByUserIdAndSwipedUserId(UUID userId, UUID swipedUserId);
    Optional<SwipeHistory> findByUserIdAndAction(UUID keycloakId, String left);
    List<SwipeHistory> findByUserId(UUID userId);
}
