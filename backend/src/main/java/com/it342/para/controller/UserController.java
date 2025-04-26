package com.it342.para.controller;

import com.it342.para.service.SupabaseService;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@CrossOrigin(origins = "http://localhost:5173")
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final SupabaseService supabaseService;
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @GetMapping("/check-user")
    public ResponseEntity<?> checkUserExists(
            @RequestParam String supabaseUid,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            // Verify the token first
            String token = authHeader.replace("Bearer ", "");
            Map<String, Object> user = supabaseService.getUserFromToken(token);

            // Check profile in Supabase
            Map<String, Object> profile = supabaseService.getProfileFromSupabase(supabaseUid);

            return ResponseEntity.ok().body(Map.of(
                    "exists", profile != null
            ));
        } catch (Exception e) {
            logger.error("Error checking user existence for UID: " + supabaseUid, e);
            return ResponseEntity.status(HttpStatus.FORBIDDEN).body(Map.of(
                    "error", "Failed to verify user existence",
                    "details", e.getMessage()
            ));
        }
    }
}