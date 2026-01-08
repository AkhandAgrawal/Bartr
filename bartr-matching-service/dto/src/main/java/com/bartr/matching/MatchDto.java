package com.bartr.matching;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDate;
import java.util.UUID;

@Data
@Builder
public class MatchDto {
    private UUID user1Id;
    private UUID user2Id;
    private LocalDate matchedDate;
}
