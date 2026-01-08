package com.bartr.matching.response;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Builder;
import lombok.Data;

import java.util.UUID;

@Data
@Builder
public class SkillsWantedDto {

    private UUID keycloakId;
    
    @JsonProperty("skill")
    private String skillName;
}
