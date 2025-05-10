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
@CrossOrigin(origins = { "http://localhost:5173",
        "https://it-342-para-cyan.vercel.app", "https://it-342-para.vercel.app" }, allowedHeaders = "*", exposedHeaders = {"Authorization", "Content-Disposition"}, maxAge = 3600)
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final SupabaseService supabaseService;
    private static final Logger logger = LoggerFactory.getLogger(UserController.class);

    @GetMapping("/profile")
    public ResponseEntity<?> getProfile(
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            logger.info("Received profile request");
            String token = authHeader.replace("Bearer ", "");
            Map<String, Object> user = supabaseService.getUserFromToken(token);
            String uid = (String) user.get("id");


            logger.info("Fetching profile for user: {}", uid);
            Map<String, Object> profile = supabaseService.getProfileFromSupabase(uid, token);

            if (profile == null) {
                logger.warn("Profile not found for user: {}", uid);
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of(
                                "error", "Profile not found",
                                "userId", uid
                        ));
            }
            logger.info("Profile data: {}", profile);
            logger.info("Successfully retrieved profile for user ID: {}", uid);


            return ResponseEntity.ok(profile);

        } catch (Exception e) {
            logger.error("Failed to fetch profile", e);
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(Map.of(
                            "error", "Failed to fetch profile",
                            "details", e.getMessage()
                    ));
        }
    }

    @PostMapping("/profile")
    public ResponseEntity<?> updateProfile(
            @RequestHeader("Authorization") String authHeader,
            @RequestBody Map<String, String> updates
    ) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Map<String, Object> user = supabaseService.getUserFromToken(token);
            String uid = (String) user.get("id");
            String email = (String) user.get("email");

            if (!updates.containsKey("username")) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Username is required"));
            }

            logger.debug("Attempting to update profile for user: {}", uid);
            logger.debug("Update payload: {}", updates);

            boolean success = supabaseService.updateProfile(
                    uid,
                    updates.get("username"),
                    email,
                    token
            );

            if (!success) {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to update profile"));
            }

            return ResponseEntity.ok(Map.of(
                    "message", "Profile updated successfully",
                    "username", updates.get("username")
            ));
        } catch (Exception e) {
            logger.error("Failed to update profile", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

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
            Map<String, Object> profile = supabaseService.getProfileFromSupabase(supabaseUid, token);

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