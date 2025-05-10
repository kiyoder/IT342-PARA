package com.it342.para.dto;


import lombok.Getter;
import lombok.Setter;

@Setter
@Getter
public class SignupRequest {
    private String username;
    private String email;
    private String password;


}
