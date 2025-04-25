// Update the SavedRouteController to handle CORS properly
package com.it342.para.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;
import org.springframework.transaction.annotation.Transactional;

import com.it342.para.dto.SavedRouteRequest;
import com.it342.para.dto.SavedRouteResponse;
import com.it342.para.model.SavedRoute;
import com.it342.para.model.User;
import com.it342.para.repository.SavedRouteRepository;
import com.it342.para.repository.UserRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@RestController
@RequestMapping("/api/saved-routes")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", methods = {
        RequestMethod.GET, RequestMethod.POST, RequestMethod.DELETE, RequestMethod.OPTIONS
})
public class SavedRouteController {
    private static final Logger logger = LoggerFactory.getLogger(SavedRouteController.class);

    @Autowired
    private SavedRouteRepository savedRouteRepository;

    @Autowired
    private UserRepository userRepository;

    /**
     * Get all saved routes for the authenticated user
     * 
     * @return List of saved routes
     */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getSavedRoutes() {
        try {
            User user = getCurrentUser();
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            List<SavedRoute> savedRoutes = savedRouteRepository.findByUser(user);

            // Convert to DTOs to avoid exposing user details
            List<SavedRouteResponse> responseList = savedRoutes.stream()
                    .map(this::convertToResponse)
                    .collect(Collectors.toList());

            return ResponseEntity.ok(responseList);
        } catch (Exception e) {
            logger.error("Failed to fetch saved routes", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch saved routes: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Save a route for the authenticated user
     * 
     * @param request The route to save
     * @return The saved route
     */
    @PostMapping(consumes = MediaType.APPLICATION_JSON_VALUE, produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> saveRoute(@RequestBody SavedRouteRequest request) {
        try {
            User user = getCurrentUser();
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            // Check if already saved
            var existingRoute = savedRouteRepository.findByUserAndRelationId(user, request.getRelationId());

            if (existingRoute.isPresent()) {
                Map<String, String> response = new HashMap<>();
                response.put("message", "Route already saved");
                return ResponseEntity.ok(response);
            }

            // Create and save the new route
            SavedRoute savedRoute = new SavedRoute();
            savedRoute.setUser(user);
            savedRoute.setRelationId(request.getRelationId());
            savedRoute.setInitialLat(request.getInitialLat());
            savedRoute.setInitialLon(request.getInitialLon());
            savedRoute.setFinalLat(request.getFinalLat());
            savedRoute.setFinalLon(request.getFinalLon());

            SavedRoute saved = savedRouteRepository.save(savedRoute);
            return ResponseEntity.ok(convertToResponse(saved));
        } catch (Exception e) {
            logger.error("Failed to save route", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to save route: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Delete a saved route
     * 
     * @param relationId The relation ID
     * @return Success message
     */
    @DeleteMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    @Transactional
    public ResponseEntity<?> deleteSavedRoute(@RequestParam String relationId) {
        try {
            User user = getCurrentUser();
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            savedRouteRepository.deleteByUserAndRelationId(user, relationId);

            Map<String, String> response = new HashMap<>();
            response.put("message", "Route deleted successfully");
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to delete saved route", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to delete saved route: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Check if a route is saved
     * 
     * @param relationId The relation ID
     * @return Boolean indicating if the route is saved
     */
    @GetMapping(value = "/check", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> isRouteSaved(@RequestParam String relationId) {
        try {
            User user = getCurrentUser();
            if (user == null) {
                return ResponseEntity.status(401).body(Map.of("error", "User not authenticated"));
            }

            boolean isSaved = savedRouteRepository.findByUserAndRelationId(user, relationId).isPresent();

            Map<String, Boolean> response = new HashMap<>();
            response.put("isSaved", isSaved);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            logger.error("Failed to check saved route", e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to check saved route: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get the currently authenticated user
     * 
     * @return The authenticated user or null if not authenticated
     */
    private User getCurrentUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()) {
            String username = authentication.getName();
            return userRepository.findByUsername(username);
        }
        return null;
    }

    /**
     * Convert a SavedRoute entity to a SavedRouteResponse DTO
     * 
     * @param savedRoute The entity to convert
     * @return The DTO
     */
    private SavedRouteResponse convertToResponse(SavedRoute savedRoute) {
        SavedRouteResponse response = new SavedRouteResponse();
        response.setId(savedRoute.getId());
        response.setRelationId(savedRoute.getRelationId());
        response.setInitialLat(savedRoute.getInitialLat());
        response.setInitialLon(savedRoute.getInitialLon());
        response.setFinalLat(savedRoute.getFinalLat());
        response.setFinalLon(savedRoute.getFinalLon());
        response.setCreatedAt(savedRoute.getCreatedAt());
        return response;
    }
}
