package com.it342.para.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import java.util.Arrays;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    Logger logger = LoggerFactory.getLogger(SecurityConfig.class);

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration configuration = new CorsConfiguration();
        configuration.setAllowedOrigins(Arrays.asList(
                "http://localhost:5173", // Local development
                "https://it-342-para-cyan.vercel.app", // Production Vercel URL
                "https://it342-para.vercel.app")); // Frontend URL
        configuration.setAllowedMethods(Arrays.asList("GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"));
        configuration.setAllowedHeaders(Arrays.asList("*"));
        configuration.setAllowCredentials(true);
        configuration.setExposedHeaders(Arrays.asList("Authorization"));

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", configuration);
        return source;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http,
            CorsConfigurationSource corsSource) throws Exception {

        http
                .cors(cors -> cors.configurationSource(corsSource))
                .csrf(csrf -> csrf.disable())
                .authorizeHttpRequests(auth -> auth
                        // 1) Let all preflight requests through
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // 2) Public endpoints
                        .requestMatchers(
                                "/api/auth/**",
                                "/api/users/check-user",
                                "/api/users/**",
                                "/api/auth/set-username",
                                "/api/users/profile")
                        .permitAll()
                        // 3) Everything else must be authenticated
                        .anyRequest().authenticated());

        logger.info("Security configuration applied successfully");
        return http.build();
    }

}
