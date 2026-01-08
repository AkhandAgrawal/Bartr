package com.bartr.user.application.utility;

import com.bartr.user.domain.entities.SkillsOffered;
import com.bartr.user.domain.entities.SkillsWanted;
import com.bartr.user.domain.entities.UserProfile;
import lombok.AllArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.stream.Collectors;

@Component
@AllArgsConstructor
public class Helper {
    public List<SkillsOffered> stringListToSkillOfferedList(List<String> skills, UserProfile userProfile){
        List<SkillsOffered> skillsOffered = skills.stream()
                .map(skill -> SkillsOffered.builder()
                        .skillName(skill)
                        .userProfile(userProfile)
                        .build())
                .collect(Collectors.toList());

        return skillsOffered;
    }

    public List<SkillsWanted> stringListToSkillWantedList(List<String> skills, UserProfile userProfile){
        List<SkillsWanted> skillsWanted = skills.stream()
                .map(skill -> SkillsWanted.builder()
                        .skillName(skill)
                        .userProfile(userProfile)
                        .build())
                .collect(Collectors.toList());

        return skillsWanted;
    }
}
