package com.it342.para.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Service
public class SupabaseService {

    @Value("${supabase.url}")
    private String supabaseUrl;

    @Value("${supabase.api-key}")
    private String supabaseApiKey;


    @Configuration
    static class SupabaseServiceConfiguration {
        @Bean
        public RestTemplate restTemplate() {
            return new RestTemplate();
        }

    }
    private final RestTemplate restTemplate;
    private static final Logger logger = LoggerFactory.getLogger(SupabaseService.class);

    public SupabaseService(RestTemplate restTemplate) {
        this.restTemplate = restTemplate;
    }

    public Map<String, Object> signUpWithEmailPassword(String email, String password) {
        String url = supabaseUrl + "/auth/v1/signup";
        HttpHeaders headers = createHeaders(supabaseApiKey);
        headers.setContentType(MediaType.APPLICATION_JSON);

        Map<String, Object> payload = new HashMap<>();
        payload.put("email", email);
        payload.put("password", password);

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.POST,
                    new HttpEntity<>(payload, headers),
                    new ParameterizedTypeReference<>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                Map<String, Object> body = response.getBody();
                if (body.containsKey("user")) {
                    return body;
                }
                return Map.of("user", Map.of("id", body.get("id")));
            }
            throw new RuntimeException("Signup failed with status: " + response.getStatusCode());
        } catch (Exception ex) {
            logger.error("Signup failed", ex);
            throw new RuntimeException("Signup failed: " + ex.getMessage(), ex);
        }
    }

    public Map<String, Object> loginWithEmailPassword(String email, String password) {
        String url = supabaseUrl + "/auth/v1/token?grant_type=password";
        return postRequest(url, Map.of("email", email, "password", password));
    }

    public boolean createProfileInSupabase(String uid, String username, String email, String userToken) {
        String url = supabaseUrl + "/rest/v1/profiles";
        Map<String, Object> profile = Map.of(
                "id", uid,
                "username", username,
                "email", email
        );

        try {
            ResponseEntity<String> response = restTemplate.postForEntity(
                    url,
                    new HttpEntity<>(profile, createHeaders(userToken)),
                    String.class
            );
            return response.getStatusCode() == HttpStatus.CREATED;
        } catch (Exception e) {
            logger.error("Profile creation failed for {}: {}", uid, e.getMessage());
            return false;
        }
    }

    public boolean updateProfile(String uid, String username, String email, String userToken) {
        String url = supabaseUrl + "/rest/v1/profiles?id=eq." + uid;
        Map<String, Object> updates = new HashMap<>();
        updates.put("username", username);
        updates.put("email", email);

        try {
            ResponseEntity<String> response = restTemplate.exchange(
                    url,
                    HttpMethod.PATCH,
                    new HttpEntity<>(updates, createHeaders(userToken)),
                    String.class
            );
            return response.getStatusCode().is2xxSuccessful();
        } catch (Exception e) {
            logger.error("Profile update failed for {}: {}", uid, e.getMessage());
            return false;
        }
    }

    public Map<String, Object> getProfileFromSupabase(String supabaseUid) {
        String url = supabaseUrl + "/rest/v1/profiles?id=eq." + supabaseUid;

        try {
            ResponseEntity<List<Map<String, Object>>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(createHeaders(supabaseApiKey)),
                    new ParameterizedTypeReference<>() {}
            );

            if (response.getStatusCode().is2xxSuccessful() && response.getBody() != null) {
                List<Map<String, Object>> profiles = response.getBody();
                if (!profiles.isEmpty()) {
                    return profiles.get(0);
                }
            }
        } catch (Exception e) {
            logger.error("Failed to fetch profile for {}: {}", supabaseUid, e.getMessage());
        }
        return null;
    }

    public Map<String, Object> exchangeGoogleAuthCodeForToken(String code) {
        String url = supabaseUrl + "/auth/v1/token?grant_type=authorization_code";
        Map<String, Object> payload = Map.of(
                "code", code,
                "redirect_uri", "your_redirect_uri",
                "client_id", "your_client_id",
                "client_secret", "your_client_secret"
        );
        return postRequest(url, payload);
    }

    public Map<String, Object> getUserFromToken(String jwt) {
        String url = supabaseUrl + "/auth/v1/user";

        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    url,
                    HttpMethod.GET,
                    new HttpEntity<>(createHeaders(jwt)),
                    new ParameterizedTypeReference<>() {}
            );
            return response.getBody();
        } catch (Exception e) {
            logger.error("Failed to get user from token", e);
            throw new RuntimeException("Invalid token: " + e.getMessage());
        }
    }

    private Map<String, Object> postRequest(String endpoint, Map<String, Object> payload) {
        try {
            ResponseEntity<Map<String, Object>> response = restTemplate.exchange(
                    endpoint,
                    HttpMethod.POST,
                    new HttpEntity<>(payload, createHeaders(supabaseApiKey)),
                    new ParameterizedTypeReference<>() {}
            );

            if (response.getStatusCode().is2xxSuccessful()) {
                return response.getBody();
            }
            throw new RuntimeException("Supabase error: " + response.getStatusCode());
        } catch (Exception e) {
            logger.error("API request failed", e);
            throw new RuntimeException("Request failed: " + e.getMessage(), e);
        }
    }

    private HttpHeaders createHeaders(String token) {
        HttpHeaders headers = new HttpHeaders();
        headers.set("apikey", supabaseApiKey);
        headers.set("Authorization", "Bearer " + token);
        headers.set("Prefer", "return=minimal");
        headers.set("Content-Type", "application/json");
        return headers;
    }
}