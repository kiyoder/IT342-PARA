package com.it342.para.config;

import com.it342.para.model.User;
import com.it342.para.service.UserService;
import com.it342.para.util.JwtTokenUtil;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.security.core.Authentication;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.security.web.authentication.SimpleUrlAuthenticationSuccessHandler;
import org.springframework.stereotype.Component;


import java.io.IOException;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;

@Component
public class CustomOAuth2SuccessHandler extends SimpleUrlAuthenticationSuccessHandler {
    private static final Logger logger = LoggerFactory.getLogger(CustomOAuth2SuccessHandler.class);

    private final UserService userService;
    private final JwtTokenUtil jwtTokenUtil;

    public CustomOAuth2SuccessHandler(UserService userService, JwtTokenUtil jwtTokenUtil) {
        this.userService = userService;
        this.jwtTokenUtil = jwtTokenUtil;
    }

    @Override
    public void onAuthenticationSuccess(HttpServletRequest request, HttpServletResponse response, Authentication authentication) throws IOException {
        OAuth2User oAuth2User = (OAuth2User) authentication.getPrincipal();
        logger.info("OAuth2 authentication successful for user: {}", (Object) oAuth2User.getAttribute("email"));
        userService.processOAuthPostLogin(oAuth2User);

        // Create a UserDetails object to generate the JWT token
        User userDetails = new User(oAuth2User.getAttribute("name"), oAuth2User.getAttribute("email"), "", "USER");


        // Generate JWT token using JwtTokenUtil
        String jwtToken = jwtTokenUtil.generateToken(userDetails);
        response.addHeader("Authorization", "Bearer " + jwtToken);


//        logger.info("Redirecting to home page after successful login");
//        response.sendRedirect("http://localhost:5173/?token=" + jwtToken);

        // Encode the token to make it URL safe
        String encodedToken = URLEncoder.encode(jwtToken, StandardCharsets.UTF_8.toString());

        logger.info("Redirecting to home page after successful login with token");
        // Redirect to frontend with token as query parameter
        response.sendRedirect("http://localhost:5173/?token=" + encodedToken);

    }
}