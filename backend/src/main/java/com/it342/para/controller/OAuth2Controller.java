package com.it342.para.controller;

import com.it342.para.model.User;
import com.it342.para.service.UserService;
import org.springframework.security.oauth2.client.authentication.OAuth2AuthenticationToken;
import org.springframework.stereotype.Controller;
import org.springframework.ui.Model;
import org.springframework.web.bind.annotation.GetMapping;

@Controller
public class OAuth2Controller {

    private final UserService userService;

    public OAuth2Controller(UserService userService) {
        this.userService = userService;
    }

    @GetMapping("/loginSuccess")
    public String loginSuccess(OAuth2AuthenticationToken authentication, Model model) {
        User user = userService.processOAuthPostLogin(authentication.getPrincipal());
        if (user.getUsername() == null || user.getUsername().isEmpty()) {
            // Prompt for username
            model.addAttribute("user", user);
            return "enterUsername";
        }
        return "redirect:/";
    }
}