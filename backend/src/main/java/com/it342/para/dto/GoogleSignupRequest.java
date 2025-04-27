package com.it342.para.dto;

import lombok.Data;

@Data
public class GoogleSignupRequest {
    private String supabaseUid;
    private String email;
    private String username;
}