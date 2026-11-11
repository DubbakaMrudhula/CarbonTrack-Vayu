package com.sustainability.auth;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sustainability.auth.controller.AuthController;
import com.sustainability.auth.dto.AuthResponse;
import com.sustainability.auth.dto.LoginRequest;
import com.sustainability.auth.dto.RegisterRequest;
import com.sustainability.auth.dto.UserSummaryDto;
import com.sustainability.auth.security.AuthEntryPoint;
import com.sustainability.auth.security.JwtAuthenticationFilter;
import com.sustainability.auth.security.JwtService;
import com.sustainability.auth.service.AuthService;
import com.sustainability.exception.DuplicateEmailException;
import com.sustainability.exception.GlobalExceptionHandler;
import com.sustainability.user.entity.Role;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = AuthController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({GlobalExceptionHandler.class})
public class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private AuthService authService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private AuthEntryPoint authEntryPoint;

    @Test
    @DisplayName("POST /api/auth/register returns 201 and AuthResponse on valid input")
    void registerReturns201() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
            .name("Asha Sharma")
            .email("asha@vayu.test")
            .password("SecurePass123")
            .acceptedTerms(true)
            .build();

        AuthResponse response = AuthResponse.builder()
            .token("valid.jwt.token")
            .expiresAt(Instant.now().plusSeconds(3600))
            .user(new UserSummaryDto(1L, "Asha Sharma", "asha@vayu.test", Role.USER))
            .build();

        when(authService.register(any(RegisterRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.token").value("valid.jwt.token"))
            .andExpect(jsonPath("$.user.email").value("asha@vayu.test"));
    }

    @Test
    @DisplayName("POST /api/auth/register returns 409 Conflict when email already exists")
    void registerReturns409OnDuplicateEmail() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
            .name("Asha Sharma")
            .email("duplicate@vayu.test")
            .password("SecurePass123")
            .acceptedTerms(true)
            .build();

        when(authService.register(any(RegisterRequest.class)))
            .thenThrow(new DuplicateEmailException("Email is already registered: duplicate@vayu.test"));

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isConflict())
            .andExpect(jsonPath("$.status").value(409))
            .andExpect(jsonPath("$.message").value("Email is already registered: duplicate@vayu.test"));
    }

    @Test
    @DisplayName("POST /api/auth/register returns 400 Bad Request when validation fails")
    void registerReturns400OnInvalidInput() throws Exception {
        // Missing name, invalid email, weak password, terms not accepted
        RegisterRequest request = RegisterRequest.builder()
            .name("")
            .email("invalid-email")
            .password("short")
            .acceptedTerms(false)
            .build();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    @DisplayName("POST /api/auth/login returns 200 OK on correct credentials")
    void loginReturns200() throws Exception {
        LoginRequest request = LoginRequest.builder()
            .email("asha@vayu.test")
            .password("SecurePass123")
            .build();

        AuthResponse response = AuthResponse.builder()
            .token("valid.jwt.token")
            .expiresAt(Instant.now().plusSeconds(3600))
            .user(new UserSummaryDto(1L, "Asha Sharma", "asha@vayu.test", Role.USER))
            .build();

        when(authService.login(any(LoginRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.token").value("valid.jwt.token"))
            .andExpect(jsonPath("$.user.email").value("asha@vayu.test"));
    }

    @Test
    @DisplayName("POST /api/auth/login returns 401 Unauthorized on invalid credentials")
    void loginReturns401OnWrongCredentials() throws Exception {
        LoginRequest request = LoginRequest.builder()
            .email("asha@vayu.test")
            .password("WrongPassword")
            .build();

        when(authService.login(any(LoginRequest.class)))
            .thenThrow(new BadCredentialsException("Invalid email or password"));

        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.message").value("Invalid email or password"));
    }

    @Test
    @DisplayName("POST /api/auth/register rejects null acceptedTerms and password without number")
    void registerRejectsNullTermsAndWeakPassword() throws Exception {
        RegisterRequest request = RegisterRequest.builder()
            .name("Asha Sharma")
            .email("asha@vayu.test")
            .password("LettersOnlyPassword")
            .acceptedTerms(null)
            .build();

        mockMvc.perform(post("/api/auth/register")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    @DisplayName("POST /api/auth/login returns 400 Bad Request on malformed JSON body")
    void loginReturns400OnMalformedJson() throws Exception {
        mockMvc.perform(post("/api/auth/login")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{bad-json"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.message").value("Malformed JSON request body"));
    }
}

