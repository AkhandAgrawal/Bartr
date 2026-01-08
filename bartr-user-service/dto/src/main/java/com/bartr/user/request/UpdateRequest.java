package com.bartr.user.request;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class UpdateRequest {
    private String firstName;
    private String lastName;
    private String gender;
    private String userName;
    private String bio;
    private String password;
    private String email;
    private List<String> skillsOffered;
    private List<String> skillsWanted;
}
