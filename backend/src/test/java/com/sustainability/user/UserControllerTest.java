package com.sustainability.user;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sustainability.auth.security.AuthEntryPoint;
import com.sustainability.auth.security.JwtAuthenticationFilter;
import com.sustainability.auth.security.JwtService;
import com.sustainability.exception.GlobalExceptionHandler;
import com.sustainability.user.controller.UserController;
import com.sustainability.user.dto.ChangePasswordRequest;
import com.sustainability.user.dto.DeleteAccountRequest;
import com.sustainability.user.dto.UpdateUserRequest;
import com.sustainability.user.dto.UserProfileResponse;
import com.sustainability.user.dto.UserPreferencesRequest;
import com.sustainability.user.dto.UserPreferencesResponse;
import com.sustainability.user.entity.Role;
import com.sustainability.user.service.UserService;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.Instant;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = UserController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({GlobalExceptionHandler.class})
public class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private AuthEntryPoint authEntryPoint;

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("GET /api/users/me returns 200 with user profile")
    void getProfileReturns200() throws Exception {
        UserProfileResponse response = UserProfileResponse.builder()
            .id(1L)
            .name("Asha Sharma")
            .email("asha@vayu.test")
            .role(Role.USER)
            .enabled(true)
            .termsAcceptedAt(Instant.now())
            .createdAt(Instant.now())
            .build();

        when(userService.getProfile()).thenReturn(response);

        mockMvc.perform(get("/api/users/me"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.email").value("asha@vayu.test"))
            .andExpect(jsonPath("$.name").value("Asha Sharma"));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("PUT /api/users/me updates name and returns 200")
    void updateProfileReturns200() throws Exception {
        UpdateUserRequest request = UpdateUserRequest.builder()
            .name("Asha S.")
            .build();

        UserProfileResponse response = UserProfileResponse.builder()
            .id(1L)
            .name("Asha S.")
            .email("asha@vayu.test")
            .role(Role.USER)
            .enabled(true)
            .build();

        when(userService.updateProfile(any(UpdateUserRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/users/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.name").value("Asha S."));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("PUT /api/users/me/preferences returns 400 when household size is invalid")
    void updatePreferencesRejectsInvalidHouseholdSize() throws Exception {
        UserPreferencesRequest invalidRequest = UserPreferencesRequest.builder()
            .country("India")
            .currency("INR")
            .dietType("VEGETARIAN")
            .primaryTransport("METRO")
            .householdSize(25) // Max allowed is 20
            .focusCategories("TRANSPORTATION")
            .build();

        mockMvc.perform(put("/api/users/me/preferences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("PUT /api/users/me/preferences updates preferences successfully")
    void updatePreferencesSucceeds() throws Exception {
        UserPreferencesRequest request = UserPreferencesRequest.builder()
            .country("India")
            .region("Karnataka")
            .currency("INR")
            .dietType("VEGAN")
            .primaryTransport("METRO")
            .householdSize(2)
            .focusCategories("TRANSPORTATION,ELECTRICITY")
            .weeklyTargetKg(new BigDecimal("15.50"))
            .build();

        UserPreferencesResponse response = UserPreferencesResponse.builder()
            .id(1L)
            .country("India")
            .region("Karnataka")
            .currency("INR")
            .dietType("VEGAN")
            .primaryTransport("METRO")
            .householdSize(2)
            .focusCategories("TRANSPORTATION,ELECTRICITY")
            .weeklyTargetKg(new BigDecimal("15.50"))
            .updatedAt(Instant.now())
            .build();

        when(userService.updatePreferences(any(UserPreferencesRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/users/me/preferences")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.currency").value("INR"))
            .andExpect(jsonPath("$.dietType").value("VEGAN"));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("PATCH /api/users/me/password returns 401 when current password is wrong")
    void changePasswordFailsOnWrongCurrentPassword() throws Exception {
        ChangePasswordRequest request = ChangePasswordRequest.builder()
            .currentPassword("WrongPassword123")
            .newPassword("NewValidPass456")
            .build();

        doThrow(new BadCredentialsException("Current password does not match"))
            .when(userService).changePassword(any(ChangePasswordRequest.class));

        mockMvc.perform(patch("/api/users/me/password")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.message").value("Current password does not match"));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("DELETE /api/users/me returns 204 No Content on account deletion")
    void deleteAccountReturns204() throws Exception {
        DeleteAccountRequest request = DeleteAccountRequest.builder()
            .password("CorrectPass123")
            .build();

        mockMvc.perform(delete("/api/users/me")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isNoContent());
    }
}

