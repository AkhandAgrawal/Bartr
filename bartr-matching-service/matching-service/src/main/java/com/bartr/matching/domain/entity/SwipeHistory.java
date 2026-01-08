package com.bartr.matching.domain.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.util.UUID;

@Entity
@Getter
@Setter
@Builder
@AllArgsConstructor
@NoArgsConstructor
@Table(name = "swipe_history", uniqueConstraints = {
    @UniqueConstraint(name = "uk_user_swiped_user", columnNames = {"userId", "swipedUserId"})
})
public class SwipeHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false)
    private UUID userId;

    @Column(nullable = false)
    private UUID swipedUserId;

    @Column(nullable = false)
    private String action;

    @Column(nullable = false)
    private LocalDate swipeDate;
}
