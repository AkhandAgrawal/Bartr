package com.bartr.user.response;


import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UserProfileResponse {
    private String userName;
    private String firstName;
    private String lastName;
    private String gender;
    private String bio;
    private int credits;
    private String email;
    private List<String> skillsOffered;
    private List<String> skillsWanted;
}
