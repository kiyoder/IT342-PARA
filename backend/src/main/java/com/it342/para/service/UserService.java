package com.it342.para.service;

import com.it342.para.model.User;
import com.it342.para.repository.UserRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.oauth2.core.user.OAuth2User;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService implements UserDetailsService {
    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private static final Logger logger = LoggerFactory.getLogger(UserService.class);


    @Autowired
    public UserService(UserRepository userRepository, PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public User save(User user) {
        try {
            if (user.getRole() == null || user.getRole().isEmpty()) {
                user.setRole("USER");
            }
            validatePasswordStrength(user.getPassword());
            user.setPassword(passwordEncoder.encode(user.getPassword()));
            return userRepository.save(user);
        } catch (Exception e) {
            logger.error("Error saving user", e); // Replace printStackTrace() with logging
            throw e;
        }
    }

    public User findByEmail(String email) {
        return userRepository.findByEmail(email);
    }

    public User findByUsername(String username) {
        return userRepository.findByUsername(username);
    }

    @Override
    public UserDetails loadUserByUsername(String username) throws UsernameNotFoundException {
        User user = userRepository.findByUsername(username);
        if (user == null) {
            throw new UsernameNotFoundException("User not found with username: " + username);
        }
        return user;
    }

    private void validatePasswordStrength(String password) {
        if (password.length() < 8 || !password.matches(".*\\d.*") || !password.matches(".*[a-z].*")
                || !password.matches(".*[A-Z].*") || !password.matches(".*[!.,@#$%^&+=].*")) {
            throw new IllegalArgumentException(
                    "Password must be at least 8 characters long, contain at least one digit, one lower case letter, one upper case letter, and one special character.");
        }
    }

    @Transactional
    public User processOAuthPostLogin(OAuth2User oAuth2User) {
        String email = oAuth2User.getAttribute("email");
        logger.info("Processing OAuth post login for email: {}", email);

        try {
            User existUser = userRepository.findByEmail(email);
            if (existUser == null) {
                logger.info("User not found. Creating a new user for email: {}", email);
                User newUser = new User(
                        oAuth2User.getAttribute("name"),
                        email,
                        "", // No password for OAuth user
                        "USER"
                );
                User savedUser = userRepository.save(newUser);
                logger.info("New user created: {}", savedUser);
                return savedUser;
            } else {
                logger.info("User found for email: {}", email);
                return existUser;
            }
        } catch (Exception e) {
            logger.error("Error processing OAuth post login for email: {}", email, e);
            throw e;
        }
    }

}