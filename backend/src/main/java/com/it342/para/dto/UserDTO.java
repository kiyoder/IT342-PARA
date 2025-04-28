package com.it342.para.dto;

public record UserDTO(
        String supabaseUid,
        String username,
        String email
) {}