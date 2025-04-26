package com.it342.para.dto;

import lombok.Data;

@Data
public class SetUsernameRequest {
    private String supabaseUid;
    private String username;
    private String email;
}