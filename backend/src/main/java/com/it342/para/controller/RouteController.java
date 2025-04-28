//package com.it342.para.controller;
//
//import org.springframework.beans.factory.annotation.Autowired;
//import org.springframework.http.ResponseEntity;
//import org.springframework.web.bind.annotation.GetMapping;
//import org.springframework.web.bind.annotation.RequestMapping;
//import org.springframework.web.bind.annotation.RequestParam;
//import org.springframework.web.bind.annotation.RestController;
//import org.springframework.http.MediaType;
//
//import com.it342.para.model.JeepneyRoute;
//import com.it342.para.repository.JeepneyRouteRepository;
//
//import java.util.HashMap;
//import java.util.Map;
//import java.util.Optional;
//
//@RestController
//@RequestMapping("/api/routes")
//public class RouteController {
//
//    @Autowired
//    private JeepneyRouteRepository jeepneyRouteRepository;
//
//    /**
//     * Lookup a route by route number and return its relation ID
//     *
//     * @param routeNumber The route number to look up
//     * @return JSON response with routeNumber and relationId
//     */
//    @GetMapping(value = "/lookup", produces = MediaType.APPLICATION_JSON_VALUE)
//    public ResponseEntity<?> lookupRoute(@RequestParam String routeNumber) {
//        if (routeNumber == null || routeNumber.trim().isEmpty()) {
//            Map<String, String> error = new HashMap<>();
//            error.put("error", "Route number is required");
//            return ResponseEntity.badRequest().body(error);
//        }
//
//        try {
//            // Normalize route number to uppercase for consistency
//            String normalizedRouteNumber = routeNumber.trim().toUpperCase();
//
//            // Find the jeepney route by route number
//            Optional<JeepneyRoute> routeOpt = jeepneyRouteRepository.findByRouteNumber(normalizedRouteNumber);
//
//            if (routeOpt.isPresent()) {
//                JeepneyRoute route = routeOpt.get();
//                Map<String, Object> response = new HashMap<>();
//                response.put("routeNumber", route.getRouteNumber());
//                response.put("relationId", route.getRelationId());
//
//                return ResponseEntity.ok(response);
//            } else {
//                Map<String, String> error = new HashMap<>();
//                error.put("error", "Route '" + normalizedRouteNumber + "' not found");
//                return ResponseEntity.status(404).body(error);
//            }
//        } catch (Exception e) {
//            Map<String, String> error = new HashMap<>();
//            error.put("error", "Database error: " + e.getMessage());
//            return ResponseEntity.status(500).body(error);
//        }
//    }
//}
