package com.it342.para.config;

import com.it342.para.service.SupabaseService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpStatus;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Collections;
import java.util.Map;

@Component
public class SupabaseJwtFilter extends OncePerRequestFilter {

    private final SupabaseService supabaseService;

    public SupabaseJwtFilter(SupabaseService supabaseService) {
        this.supabaseService = supabaseService;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request,
                                    HttpServletResponse response,
                                    FilterChain filterChain)
            throws ServletException, IOException {

        String authHeader = request.getHeader("Authorization");

        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            filterChain.doFilter(request, response);
            return;
        }

        String token = authHeader.substring(7).trim();
        logger.info("Processing JWT token: " + token.substring(0, Math.min(token.length(), 20)) + "...");



        try {
            // Validate token with Supabase
            Map<String, Object> user = supabaseService.getUserFromToken(token);
            logger.info("User authenticated: " + user.get("email"));

            // Create authentication object
            UsernamePasswordAuthenticationToken authentication =
                    new UsernamePasswordAuthenticationToken(
                            user.get("email"),
                            null,
                            Collections.emptyList()
                    );

            SecurityContextHolder.getContext().setAuthentication(authentication);

        } catch (Exception e) {
            logger.error("JWT validation failed for token:"+ token + " Error: " + e.getMessage());
            response.sendError(HttpStatus.UNAUTHORIZED.value(), "Invalid token: " + e.getMessage());
            return;
        }

        filterChain.doFilter(request, response);
    }
}
