package com.it342.para.dto;

import lombok.Data;

@Data
public class LoginRequest {
    private String email;
    private String password;
}
