package com.bartr.matching.response;

import jakarta.persistence.Column;
import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.UUID;

@Data
@Builder
public class UserProfileDto {
    private UUID keycloakId;
    private List<SkillsOfferedDto> skillsOffered;
    private List<SkillsWantedDto> skillsWanted;
    private String firstName;
    private String lastName;
    private String gender;
    private String userName;
    private String email;
}
