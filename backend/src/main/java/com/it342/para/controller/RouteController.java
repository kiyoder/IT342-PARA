// Update the RouteController to handle CORS properly
package com.it342.para.controller;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.http.MediaType;

import com.it342.para.model.JeepneyRoute;
import com.it342.para.repository.JeepneyRouteRepository;

import java.util.HashMap;
import java.util.Map;
import java.util.Optional;

@RestController
@RequestMapping("/api/routes")
@CrossOrigin(origins = "http://localhost:5173", allowedHeaders = "*", methods = {
        RequestMethod.GET, RequestMethod.POST, RequestMethod.OPTIONS
})
public class RouteController {

    @Autowired
    private JeepneyRouteRepository jeepneyRouteRepository;

    /**
     * Lookup a route by route number and return its details
     * 
     * @param routeNumber The route number to look up
     * @return JSON response with routeNumber, relationId, and locations
     */
    @GetMapping(value = "/lookup", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> lookupRoute(@RequestParam String routeNumber) {
        if (routeNumber == null || routeNumber.trim().isEmpty()) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Route number is required");
            return ResponseEntity.badRequest().body(error);
        }

        try {
            // Normalize route number to uppercase for consistency
            String normalizedRouteNumber = routeNumber.trim().toUpperCase();

            // Find the jeepney route by route number
            Optional<JeepneyRoute> routeOpt = jeepneyRouteRepository.findByRouteNumber(normalizedRouteNumber);

            if (routeOpt.isPresent()) {
                JeepneyRoute route = routeOpt.get();
                Map<String, Object> response = new HashMap<>();
                response.put("routeNumber", route.getRouteNumber());
                response.put("relationId", route.getRelationId());
                // include locations field
                response.put("locations", route.getLocations());

                return ResponseEntity.ok(response);
            } else {
                Map<String, String> error = new HashMap<>();
                error.put("error", "Route '" + normalizedRouteNumber + "' not found");
                return ResponseEntity.status(404).body(error);
            }
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Database error: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }

    /**
     * Fetch all routes and return necessary fields
     * 
     * @return JSON list of routeNumber, relationId, and locations
     */
    @GetMapping(value = "/all", produces = MediaType.APPLICATION_JSON_VALUE)
    public ResponseEntity<?> getAllRoutes() {
        try {
            var routes = jeepneyRouteRepository.findAll();

            // Map only the necessary fields: routeNumber, relationId, locations
            var simplifiedRoutes = routes.stream().map(route -> {
                Map<String, Object> map = new HashMap<>();
                map.put("routeNumber", route.getRouteNumber());
                map.put("relationId", route.getRelationId());
                map.put("locations", route.getLocations()); // include locations here
                return map;
            }).toList();

            return ResponseEntity.ok(simplifiedRoutes);
        } catch (Exception e) {
            Map<String, String> error = new HashMap<>();
            error.put("error", "Failed to fetch routes: " + e.getMessage());
            return ResponseEntity.status(500).body(error);
        }
    }
}
