package com.it342.para.controller;

import com.it342.para.model.User;
import com.it342.para.service.UserService;
import com.it342.para.util.JwtTokenUtil;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.MockitoAnnotations;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@SpringBootTest
@AutoConfigureMockMvc
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Mock
    private UserService userService;

    @Mock
    private AuthenticationManager authenticationManager;

    @Mock
    private JwtTokenUtil jwtTokenUtil;

    @InjectMocks
    private UserController userController;

    @BeforeEach
    void setUp() {
        MockitoAnnotations.openMocks(this);
        mockMvc = MockMvcBuilders.standaloneSetup(userController).build();
    }

    @Test
    void testRegisterUser() throws Exception {
        User user = new User();
        user.setUsername("testUser");
        user.setPassword("testPassword");
        user.setEmail("testUser@example.com");
        user.setRole("USER");

        when(userService.save(any(User.class))).thenReturn(user);

        mockMvc.perform(post("/api/users/register")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testUser\",\"password\":\"testPassword\",\"email\":\"testUser@example.com\",\"role\":\"USER\"}"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("testUser"))
                .andExpect(jsonPath("$.email").value("testUser@example.com"))
                .andExpect(jsonPath("$.role").value("USER"));

        verify(userService, times(1)).save(any(User.class));
    }

    @Test
    void testLoginUserSuccess() throws Exception {
        User user = new User();
        user.setUsername("testUser");
        user.setPassword("testPassword");

        UserDetails userDetails = mock(UserDetails.class);

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenReturn(null);
        when(userService.loadUserByUsername("testUser")).thenReturn(userDetails);
        when(jwtTokenUtil.generateToken(userDetails)).thenReturn("mockToken");

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testUser\",\"password\":\"testPassword\"}"))
                .andExpect(status().isOk())
                .andExpect(content().string("mockToken"));

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userService, times(1)).loadUserByUsername("testUser");
        verify(jwtTokenUtil, times(1)).generateToken(userDetails);
    }

    @Test
    void testLoginUserFailure() throws Exception {
        User user = new User();
        user.setUsername("testUser");
        user.setPassword("testPassword");

        when(authenticationManager.authenticate(any(UsernamePasswordAuthenticationToken.class))).thenThrow(new AuthenticationException("Invalid username or password") {});

        mockMvc.perform(post("/api/users/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{\"username\":\"testUser\",\"password\":\"testPassword\"}"))
                .andExpect(status().isUnauthorized())
                .andExpect(content().string("Invalid username or password"));

        verify(authenticationManager, times(1)).authenticate(any(UsernamePasswordAuthenticationToken.class));
        verify(userService, never()).loadUserByUsername(anyString());
        verify(jwtTokenUtil, never()).generateToken(any(UserDetails.class));
    }
}