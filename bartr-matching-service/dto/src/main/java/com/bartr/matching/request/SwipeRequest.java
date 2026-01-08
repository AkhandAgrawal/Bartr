package com.bartr.matching.request;

import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class SwipeRequest {
    private UUID userId;
    private UUID swipedUserId;
    private String action;
}
