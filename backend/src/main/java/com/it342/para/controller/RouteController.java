package com.it342.para.controller;

import com.it342.para.dto.JeepneyRouteDTO;
import com.it342.para.dto.RouteLookupRequest;
import com.it342.para.dto.RouteLookupResponse;
import com.it342.para.service.SupabaseService;

import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@RestController
@CrossOrigin(origins = "*", allowedHeaders = "*", exposedHeaders = "Authorization")
@RequestMapping("/api/routes")
@RequiredArgsConstructor
public class RouteController {

    private final SupabaseService supabaseService;
    private static final Logger logger = LoggerFactory.getLogger(RouteController.class);

    /**
     * Lookup a route by route number and return its relation ID
     *
     * @param routeNumber The route number to look up
     * @return JSON response with routeNumber and relationId
     */
    @GetMapping(value = "/lookup", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> lookupRoute(@RequestParam String routeNumber,
                                         @RequestHeader("Authorization") String authHeader) {
        if (routeNumber == null || routeNumber.trim().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Route number is required");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            // Extract token from Authorization header
            String token = authHeader.replace("Bearer ", "");

            // Verify user authentication
            Map<String, Object> user = supabaseService.getUserFromToken(token);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid authentication token"));
            }

            // Normalize route number to uppercase for consistency
            String normalizedRouteNumber = routeNumber.trim().toUpperCase();
            logger.info("Looking up route: {}", normalizedRouteNumber);

            // Find the jeepney route by route number using Supabase
            Map<String, Object> route = supabaseService.findRouteByRouteNumber(normalizedRouteNumber, token);

            if (route != null) {
                // Create response DTO
                RouteLookupResponse response = new RouteLookupResponse(
                        (String) route.get("route_number"),
                        (String) route.get("relation_id")
                );
                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Route '" + normalizedRouteNumber + "' not found");
                return ResponseEntity.status(404).body(error);
            }
        } catch (Exception e) {
            logger.error("Error looking up route: {}", e.getMessage(), e);
            Map<String, String> error = new HashMap<>();
            error.put("error", "Error processing request: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Get all routes
     *
     * @return List of all routes
     */
    @GetMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getAllRoutes(@RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.replace("Bearer ", "");

            // Verify user authentication
            Map<String, Object> user = supabaseService.getUserFromToken(token);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid authentication token"));
            }

            logger.info("Fetching all routes");
            List<Map<String, Object>> routes = supabaseService.getAllRoutes(token);

            // Map the results to DTOs
            List<JeepneyRouteDTO> routeDTOs = routes.stream()
                    .map(route -> {
                        JeepneyRouteDTO dto = new JeepneyRouteDTO();
                        dto.setId(Long.valueOf(route.get("id").toString()));
                        dto.setRouteNumber((String) route.get("route_number"));
                        dto.setRelationId((String) route.get("relation_id"));
                        dto.setLocations((String) route.get("locations"));
                        return dto;
                    })
                    .collect(Collectors.toList());

            return ResponseEntity.ok(routeDTOs);
        } catch (Exception e) {
            logger.error("Error fetching all routes: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error fetching routes: " + e.getMessage()));
        }
    }

    /**
     * Create a new route
     *
     * @param routeDTO The route data
     * @return Created route data
     */
    @PostMapping(produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> createRoute(@RequestBody JeepneyRouteDTO routeDTO,
                                         @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.replace("Bearer ", "");

            // Verify user authentication
            Map<String, Object> user = supabaseService.getUserFromToken(token);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid authentication token"));
            }

            // Validate the required fields
            if (routeDTO.getRouteNumber() == null || routeDTO.getRouteNumber().trim().isEmpty() ||
                    routeDTO.getRelationId() == null || routeDTO.getRelationId().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Route number and relation ID are required"));
            }

            logger.info("Creating new route with number: {}", routeDTO.getRouteNumber());

            boolean success = supabaseService.createRoute(
                    routeDTO.getRouteNumber(),
                    routeDTO.getRelationId(),
                    routeDTO.getLocations(),
                    token
            );

            if (success) {
                // Find the newly created route to get its ID
                Map<String, Object> createdRoute = supabaseService.findRouteByRouteNumber(
                        routeDTO.getRouteNumber().trim().toUpperCase(),
                        token
                );

                if (createdRoute != null) {
                    JeepneyRouteDTO responseDTO = new JeepneyRouteDTO();
                    responseDTO.setId(Long.valueOf(createdRoute.get("id").toString()));
                    responseDTO.setRouteNumber((String) createdRoute.get("route_number"));
                    responseDTO.setRelationId((String) createdRoute.get("relation_id"));
                    responseDTO.setLocations((String) createdRoute.get("locations"));

                    return ResponseEntity.status(HttpStatus.CREATED).body(responseDTO);
                }

                return ResponseEntity.status(HttpStatus.CREATED)
                        .body(Map.of("message", "Route created successfully"));
            } else {
                return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                        .body(Map.of("error", "Failed to create route"));
            }
        } catch (Exception e) {
            logger.error("Error creating route: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error creating route: " + e.getMessage()));
        }
    }

    /**
     * Update an existing route
     *
     * @param id The route ID
     * @param routeDTO The updated route data
     * @return Updated route data
     */
    @PutMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> updateRoute(@PathVariable Long id,
                                         @RequestBody JeepneyRouteDTO routeDTO,
                                         @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.replace("Bearer ", "");

            // Verify user authentication
            Map<String, Object> user = supabaseService.getUserFromToken(token);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid authentication token"));
            }

            // Validate the required fields
            if (routeDTO.getRouteNumber() == null || routeDTO.getRouteNumber().trim().isEmpty() ||
                    routeDTO.getRelationId() == null || routeDTO.getRelationId().trim().isEmpty()) {
                return ResponseEntity.badRequest()
                        .body(Map.of("error", "Route number and relation ID are required"));
            }

            logger.info("Updating route with ID: {}", id);

            boolean success = supabaseService.updateRoute(
                    id,
                    routeDTO.getRouteNumber(),
                    routeDTO.getRelationId(),
                    routeDTO.getLocations(),
                    token
            );

            if (success) {
                return ResponseEntity.ok(Map.of(
                        "message", "Route updated successfully",
                        "id", id
                ));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Route not found or update failed"));
            }
        } catch (Exception e) {
            logger.error("Error updating route: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error updating route: " + e.getMessage()));
        }
    }

    /**
     * Delete a route
     *
     * @param id The route ID to delete
     * @return Success message
     */
    @DeleteMapping(value = "/{id}", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> deleteRoute(@PathVariable Long id,
                                         @RequestHeader("Authorization") String authHeader) {
        try {
            // Extract token from Authorization header
            String token = authHeader.replace("Bearer ", "");

            // Verify user authentication
            Map<String, Object> user = supabaseService.getUserFromToken(token);
            if (user == null) {
                return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                        .body(Map.of("error", "Invalid authentication token"));
            }

            logger.info("Deleting route with ID: {}", id);

            boolean success = supabaseService.deleteRoute(id, token);

            if (success) {
                return ResponseEntity.ok(Map.of(
                        "message", "Route deleted successfully",
                        "id", id
                ));
            } else {
                return ResponseEntity.status(HttpStatus.NOT_FOUND)
                        .body(Map.of("error", "Route not found or delete failed"));
            }
        } catch (Exception e) {
            logger.error("Error deleting route: {}", e.getMessage(), e);
            return ResponseEntity.status(500)
                    .body(Map.of("error", "Error deleting route: " + e.getMessage()));
        }
    }
}