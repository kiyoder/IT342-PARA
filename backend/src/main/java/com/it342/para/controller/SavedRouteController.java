package com.it342.para.controller;

import com.it342.para.dto.SavedRouteRequest;
import com.it342.para.dto.SavedRouteResponse;
import com.it342.para.service.SupabaseService;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/saved-routes")
@CrossOrigin(origins = "*", allowedHeaders = "*", methods = {
        RequestMethod.GET, RequestMethod.POST, RequestMethod.DELETE, RequestMethod.OPTIONS
})
public class SavedRouteController {
    private static final Logger logger = LoggerFactory.getLogger(SavedRouteController.class);

    private final SupabaseService supabaseService;

    public SavedRouteController(SupabaseService supabaseService) {
        this.supabaseService = supabaseService;
    }

    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getSavedRoutes(@RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Map<String, Object> user = supabaseService.getUserFromToken(token);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
            }

            String userId = user.get("id").toString();
            List<Map<String, Object>> savedRoutes = supabaseService.getSavedRoutes(userId, token);

            return ResponseEntity.ok(savedRoutes.stream()
                    .map(this::convertToResponse)
                    .toList());
        } catch (Exception e) {
            logger.error("Failed to fetch saved routes", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to fetch saved routes: " + e.getMessage()));
        }
    }

    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> saveRoute(@RequestBody SavedRouteRequest request,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Map<String, Object> user = supabaseService.getUserFromToken(token);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
            }

            String userId = user.get("id").toString();

            // Check if already saved
            boolean isSaved = supabaseService.isRouteSaved(userId, request.getRelationId(), token);
            if (isSaved) {
                return ResponseEntity.ok(Map.of("message", "Route already saved"));
            }

            // Create the saved route in Supabase
            Map<String, Object> savedRoute = new HashMap<>();
            savedRoute.put("user_id", userId);
            savedRoute.put("relation_id", request.getRelationId());
            savedRoute.put("initial_lat", request.getInitialLat());
            savedRoute.put("initial_lon", request.getInitialLon());
            savedRoute.put("final_lat", request.getFinalLat());
            savedRoute.put("final_lon", request.getFinalLon());

            boolean success = supabaseService.createSavedRoute(savedRoute, token);
            if (success) {
                return ResponseEntity.ok(Map.of(
                        "message", "Route saved successfully",
                        "alreadyExists", false
                ));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to save route"));
            }
        } catch (Exception e) {
            logger.error("Failed to save route", e);
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteSavedRoute(@RequestParam String relationId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Map<String, Object> user = supabaseService.getUserFromToken(token);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
            }

            String userId = user.get("id").toString();
            boolean success = supabaseService.deleteSavedRoute(userId, relationId, token);

            if (success) {
                return ResponseEntity.ok(Map.of("message", "Route deleted successfully"));
            } else {
                return ResponseEntity.status(500).body(Map.of("error", "Failed to delete saved route"));
            }
        } catch (Exception e) {
            logger.error("Failed to delete saved route", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to delete saved route: " + e.getMessage()));
        }
    }

    @GetMapping(value = "/check", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> isRouteSaved(@RequestParam String relationId,
            @RequestHeader("Authorization") String authHeader) {
        try {
            String token = authHeader.replace("Bearer ", "");
            Map<String, Object> user = supabaseService.getUserFromToken(token);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(Map.of("error", "User not authenticated"));
            }

            String userId = user.get("id").toString();
            boolean isSaved = supabaseService.isRouteSaved(userId, relationId, token);

            return ResponseEntity.ok(Map.of("isSaved", isSaved));
        } catch (Exception e) {
            logger.error("Failed to check saved route", e);
            return ResponseEntity.status(500).body(Map.of("error", "Failed to check saved route: " + e.getMessage()));
        }
    }

    private SavedRouteResponse convertToResponse(Map<String, Object> savedRoute) {
        SavedRouteResponse response = new SavedRouteResponse();
        response.setId(Long.valueOf(savedRoute.get("id").toString()));
        response.setRelationId((String) savedRoute.get("relation_id"));
        response.setInitialLat((Double) savedRoute.get("initial_lat"));
        response.setInitialLon((Double) savedRoute.get("initial_lon"));
        response.setFinalLat((Double) savedRoute.get("final_lat"));
        response.setFinalLon((Double) savedRoute.get("final_lon"));
        response.setCreatedAt(OffsetDateTime.parse(savedRoute.get("created_at").toString()));
        return response;
    }
}