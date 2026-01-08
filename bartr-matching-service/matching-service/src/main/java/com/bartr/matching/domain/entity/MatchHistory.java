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
@Table(name = "match_history")
public class MatchHistory {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false)
    private UUID user1Id;

    @Column(nullable = false)
    private UUID user2Id;

    @Column(nullable = false)
    private LocalDate matchedDate;
}
