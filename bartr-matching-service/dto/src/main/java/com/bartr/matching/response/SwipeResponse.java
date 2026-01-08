package com.bartr.matching.response;

import com.bartr.matching.MatchDto;
import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class SwipeResponse {
    private MatchDto matchDto;
    private boolean matched;
}
