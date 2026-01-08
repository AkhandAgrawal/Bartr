package com.bartr.matching.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class MatchHistoryResponse {
    private UUID user1Id;
    private UUID user2Id;
    private LocalDate matchedDate;
    private UserProfileDto otherUser;
}

