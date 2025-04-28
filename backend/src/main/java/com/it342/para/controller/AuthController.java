package com.it342.para.controller;

import com.it342.para.dto.LoginRequest;
import com.it342.para.dto.SetUsernameRequest;
import com.it342.para.dto.SignupRequest;
import com.it342.para.dto.UserDTO;

import com.it342.para.service.SupabaseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", exposedHeaders = "Authorization")
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final SupabaseService supabaseService;


    private static final Logger logger = LoggerFactory.getLogger(AuthController.class);

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody SignupRequest signupRequest) {
        try {
            logger.info("Processing signup request for email: {}", signupRequest.getEmail());

            // 1. Create user in Supabase (auth.users)
            Map<String, Object> supabaseUser = supabaseService.signUpWithEmailPassword(
                    signupRequest.getEmail(),
                    signupRequest.getPassword()
            );
            logger.info("Supabase user created successfully");

            // Extract user ID
            String supabaseUid = ((Map<String, String>) supabaseUser.get("user")).get("id");
            if (supabaseUid == null || supabaseUid.isEmpty()) {
                throw new RuntimeException("Supabase UID missing");
            }

            // 2. Get the access token from the signup response
            String accessToken = (String) supabaseUser.get("access_token");
            if (accessToken == null) {
                throw new RuntimeException("No access token received");
            }

            logger.info("Access token received: {}", accessToken.substring(0, 15) + "...");


            // 3. Create profile using the user's access token
            boolean profileCreated = supabaseService.createProfileInSupabase(
                    supabaseUid,
                    signupRequest.getUsername(),
                    signupRequest.getEmail(),
                    accessToken  // This is crucial!
            );

            if (!profileCreated) {
                throw new RuntimeException("Failed to create user profile");
            }

            logger.info("Profile created successfully for user: {}", supabaseUid);

            // 4. Create UserDTO and return response
            UserDTO userDTO = new UserDTO(
                    supabaseUid,
                    signupRequest.getUsername(),
                    signupRequest.getEmail()
            );
            return ResponseEntity.ok(Map.of(
                    "message", "Signup successful",
                    "user", userDTO,
                    "accessToken", accessToken
            ));


        } catch (RuntimeException ex) {
            logger.error("Error during signup process", ex);
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(Map.of("error", ex.getMessage()));
        }
    }

    @GetMapping("/google-callback")
    public ResponseEntity<String> handleGoogleCallback(@RequestParam String code) {
        try {
            return ResponseEntity.ok("Success");
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body("Failed to process login");
        }
    }


    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest loginRequest) {
        try {
            logger.info("Processing login request for email: {}", loginRequest.getEmail());

            // 1. Login user in Supabase
            Map<String, Object> tokenResponse = supabaseService.loginWithEmailPassword(loginRequest.getEmail(), loginRequest.getPassword());

            String accessToken = (String) tokenResponse.get("access_token");
            logger.info("Login successful, access token generated");

            // 2. Return access token to frontend
            Map<String, String> response = new HashMap<>();
            response.put("accessToken", accessToken);

            return ResponseEntity.ok(response);
        } catch (Exception ex) {
            logger.error("Error during login process", ex);
            return ResponseEntity
                    .status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of("error", "Login failed: " + ex.getMessage()));
        }
    }

    @PostMapping("/set-username")
    public ResponseEntity<?> setUsername(
            @RequestBody SetUsernameRequest request,
            @RequestHeader("Authorization") String authHeader
    ) {
        try {
            String token = authHeader.replace("Bearer ", "");

            // 1. Get user email from token
            Map<String, Object> user = supabaseService.getUserFromToken(token);
            String email = (String) user.get("email");

            // 2. Check if profile exists
            Map<String, Object> profile = supabaseService.getProfileFromSupabase(request.getSupabaseUid(), token);

            if (profile == null) {
                // 3a. Create new profile if doesn't exist
                boolean created = supabaseService.createProfileInSupabase(
                        request.getSupabaseUid(),
                        request.getUsername(),
                        email,
                        token
                );
                if (!created) throw new RuntimeException("Profile creation failed");
            } else {
                // 3b. Update existing profile
                boolean updated = supabaseService.updateProfile(
                        request.getSupabaseUid(),
                        request.getUsername(),
                        request.getEmail(),
                        token
                );
                if (!updated) throw new RuntimeException("Profile update failed");
            }

            // Create UserDTO for response
            UserDTO userDTO = new UserDTO(
                    request.getSupabaseUid(),
                    request.getUsername(),
                    email
            );

            return ResponseEntity.ok(Map.of(
                    "message", "Username set successfully",
                    "accessToken", token,
                    "user", userDTO
            ));
        } catch (Exception e) {
            logger.error("Error setting username", e);
            return ResponseEntity.internalServerError()
                    .body(Map.of("error", e.getMessage()));
        }
    }

    // Add a debug endpoint to validate tokens
    @GetMapping("/validate-token")
    public ResponseEntity<?> validateToken(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            logger.info("Validating token: {}", token.substring(0, 15) + "...");

            Map<String, Object> user = supabaseService.getUserFromToken(token);
            String userId = (String) user.get("id");

            // Get profile data
            Map<String, Object> profile = supabaseService.getProfileFromSupabase(userId, token);

            String username = profile != null ? (String) profile.get("username") : "";
            String email = (String) user.get("email");

            // Create UserDTO for response
            UserDTO userDTO = new UserDTO(userId, username, email);

            return ResponseEntity.ok(Map.of(
                    "valid", true,
                    "user", userDTO
            ));
        } catch (Exception e) {
            logger.error("Token validation failed", e);
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                    .body(Map.of(
                            "valid", false,
                            "error", e.getMessage()
                    ));
        }
    }
}