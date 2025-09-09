package com.loanmanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.loanmanagement.config.JwtUtil;
import com.loanmanagement.config.TestSecurityConfig;
import com.loanmanagement.dto.AuthResponse;
import com.loanmanagement.dto.LoginRequest;
import com.loanmanagement.dto.RegisterRequest;
import com.loanmanagement.dto.UpdatePasswordRequest;
import com.loanmanagement.model.User.Role;
import com.loanmanagement.service.AuthService;

import org.junit.jupiter.api.Test;
import org.mockito.Mockito;

import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

@Import(TestSecurityConfig.class)
@WebMvcTest(AuthController.class)
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtUtil jwtUtil;

    @Autowired
    private ObjectMapper objectMapper;

    // ✅ LOGIN - SUCCESS
    @Test
    public void testLogin_Success() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("testuser123");
        request.setPassword("Valid@123");

        AuthResponse mockResponse = new AuthResponse("mockedToken", Role.CUSTOMER);

        when(authService.login(Mockito.any(LoginRequest.class))).thenReturn(mockResponse);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("mockedToken"))
            .andExpect(jsonPath("$.role").value("CUSTOMER"));
    }

    // ✅ LOGIN - INVALID CREDENTIALS
    @Test
    public void testLogin_InvalidCredentials_ReturnsUnauthorized() throws Exception {
        LoginRequest request = new LoginRequest();
        request.setUsername("wronguser123");
        request.setPassword("Wrong@123");

        when(authService.login(Mockito.any(LoginRequest.class)))
                .thenThrow(new RuntimeException("Invalid credentials"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.message").value("Invalid credentials"));
    }

    // ✅ REGISTER - SUCCESS
    @Test
    public void testRegister_Success() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("newuser123");
        request.setName("New User");
        request.setEmail("newuser@example.com");
        request.setPassword("Valid@123");
        request.setRole(Role.CUSTOMER);

        doNothing().when(authService).register(Mockito.any(RegisterRequest.class));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("User registered successfully!"));
    }

    // ✅ REGISTER - FAILURE (existing user/email)
    @Test
    public void testRegister_Failure_ReturnsBadRequest() throws Exception {
        RegisterRequest request = new RegisterRequest();
        request.setUsername("existinguser123");
        request.setName("Existing User");
        request.setEmail("existing@example.com");
        request.setPassword("Valid@123");
        request.setRole(Role.CUSTOMER);

        doThrow(new RuntimeException("Email already exists"))
                .when(authService)
                .register(Mockito.any(RegisterRequest.class));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Email already exists"));
    }

    // ✅ UPDATE PASSWORD - SUCCESS
    @Test
    public void testUpdatePassword_Success() throws Exception {
        UpdatePasswordRequest request = new UpdatePasswordRequest();
        request.setUsername("testuser123");
        request.setNewPassword("Valid@123");
        request.setConfirmPassword("Valid@123");

        doNothing().when(authService).updatePassword("testuser123", "Valid@123", "Valid@123");

        mockMvc.perform(post("/api/auth/update-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.message").value("Password updated successfully!"));
    }

    // ✅ UPDATE PASSWORD - MISMATCH
    @Test
    public void testUpdatePassword_MismatchPasswords_ReturnsBadRequest() throws Exception {
        UpdatePasswordRequest request = new UpdatePasswordRequest();
        request.setUsername("testuser123");
        request.setNewPassword("Valid@123");
        request.setConfirmPassword("Mismatch@123");

        doThrow(new RuntimeException("Passwords do not match"))
                .when(authService)
                .updatePassword("testuser123", "Valid@123", "Mismatch@123");

        mockMvc.perform(post("/api/auth/update-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Passwords do not match"));
    }

    // ✅ UPDATE PASSWORD - USER NOT FOUND
    @Test
    public void testUpdatePassword_UserNotFound_ReturnsBadRequest() throws Exception {
        UpdatePasswordRequest request = new UpdatePasswordRequest();
        request.setUsername("unknownuser123");
        request.setNewPassword("Valid@123");
        request.setConfirmPassword("Valid@123");

        doThrow(new RuntimeException("User not found"))
                .when(authService)
                .updatePassword("unknownuser123", "Valid@123", "Valid@123");

        mockMvc.perform(post("/api/auth/update-password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("User not found"));
    }
    

    
    
}
