package com.sustainability.activity;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sustainability.activity.controller.ActivityController;
import com.sustainability.activity.dto.ActivityRequest;
import com.sustainability.activity.dto.ActivityResponse;
import com.sustainability.activity.dto.PatchActivityRequest;
import com.sustainability.activity.service.ActivityService;
import com.sustainability.auth.security.AuthEntryPoint;
import com.sustainability.auth.security.JwtAuthenticationFilter;
import com.sustainability.auth.security.JwtService;
import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.exception.GlobalExceptionHandler;
import com.sustainability.exception.InvalidQuantityException;
import com.sustainability.exception.ResourceNotFoundException;
import com.sustainability.exception.UnitMismatchException;
import com.sustainability.exception.UnknownActivityTypeException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.http.MediaType;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = ActivityController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({GlobalExceptionHandler.class})
public class ActivityControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private ActivityService activityService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private AuthEntryPoint authEntryPoint;

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("POST /api/activities returns 201 Created and response body on valid request")
    void createActivityReturns201() throws Exception {
        ActivityRequest request = ActivityRequest.builder()
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .quantity(new BigDecimal("50.0000"))
            .unit("km")
            .logDate(LocalDate.now())
            .notes("City driving")
            .build();

        ActivityResponse response = ActivityResponse.builder()
            .id(1L)
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .displayName("Petrol Car")
            .quantity(new BigDecimal("50.0000"))
            .unit("km")
            .emissionKgCo2e(new BigDecimal("8.5240"))
            .logDate(LocalDate.now())
            .notes("City driving")
            .build();

        when(activityService.createActivity(any(ActivityRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/activities")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.id").value(1))
            .andExpect(jsonPath("$.emissionKgCo2e").value(8.5240));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("POST /api/activities returns 400 Bad Request with field errors when input is invalid")
    void createActivityReturns400OnValidationFailure() throws Exception {
        // Missing category, activityType, and zero quantity
        ActivityRequest invalidRequest = ActivityRequest.builder()
            .quantity(BigDecimal.ZERO)
            .unit("")
            .logDate(LocalDate.now())
            .build();

        mockMvc.perform(post("/api/activities")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.fieldErrors").isArray());
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("GET /api/activities returns 200 OK and paginated response")
    void listActivitiesReturns200() throws Exception {
        ActivityResponse item = ActivityResponse.builder()
            .id(1L)
            .category(ActivityCategory.ELECTRICITY)
            .activityType("ELECTRICITY_GRID")
            .displayName("Grid Electricity")
            .quantity(new BigDecimal("100.0000"))
            .unit("kWh")
            .emissionKgCo2e(new BigDecimal("71.6000"))
            .logDate(LocalDate.now())
            .build();

        when(activityService.listActivities(any(), any(), any(), any(Pageable.class)))
            .thenReturn(new PageImpl<>(List.of(item)));

        mockMvc.perform(get("/api/activities"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.content[0].activityType").value("ELECTRICITY_GRID"));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("GET /api/activities/{id} returns 200 OK when activity exists")
    void getActivityByIdReturns200() throws Exception {
        ActivityResponse item = ActivityResponse.builder()
            .id(10L)
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .displayName("Petrol Car")
            .quantity(new BigDecimal("20.0000"))
            .unit("km")
            .emissionKgCo2e(new BigDecimal("3.4096"))
            .logDate(LocalDate.now())
            .build();

        when(activityService.getActivityById(10L)).thenReturn(item);

        mockMvc.perform(get("/api/activities/10"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.id").value(10))
            .andExpect(jsonPath("$.displayName").value("Petrol Car"));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("GET /api/activities/{id} returns 404 Not Found when activity does not exist")
    void getActivityByIdReturns404() throws Exception {
        when(activityService.getActivityById(99L))
            .thenThrow(new ResourceNotFoundException("Activity not found with id: 99"));

        mockMvc.perform(get("/api/activities/99"))
            .andExpect(status().isNotFound())
            .andExpect(jsonPath("$.status").value(404))
            .andExpect(jsonPath("$.message").value("Activity not found with id: 99"));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("PUT /api/activities/{id} returns 200 OK with updated activity")
    void updateActivityReturns200() throws Exception {
        ActivityRequest request = ActivityRequest.builder()
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .quantity(new BigDecimal("80.0000"))
            .unit("km")
            .logDate(LocalDate.now())
            .build();

        ActivityResponse response = ActivityResponse.builder()
            .id(1L)
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .displayName("Petrol Car")
            .quantity(new BigDecimal("80.0000"))
            .unit("km")
            .emissionKgCo2e(new BigDecimal("13.6384"))
            .logDate(LocalDate.now())
            .build();

        when(activityService.updateActivity(eq(1L), any(ActivityRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/activities/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.emissionKgCo2e").value(13.6384));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("PATCH /api/activities/{id} returns 200 OK with partially updated activity")
    void patchActivityReturns200() throws Exception {
        PatchActivityRequest request = PatchActivityRequest.builder()
            .notes("Updated notes only")
            .build();

        ActivityResponse response = ActivityResponse.builder()
            .id(1L)
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .displayName("Petrol Car")
            .quantity(new BigDecimal("50.0000"))
            .unit("km")
            .emissionKgCo2e(new BigDecimal("8.5240"))
            .logDate(LocalDate.now())
            .notes("Updated notes only")
            .build();

        when(activityService.patchActivity(eq(1L), any(PatchActivityRequest.class))).thenReturn(response);

        mockMvc.perform(patch("/api/activities/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.notes").value("Updated notes only"));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("DELETE /api/activities/{id} returns 204 No Content")
    void deleteActivityReturns204() throws Exception {
        mockMvc.perform(delete("/api/activities/1"))
            .andExpect(status().isNoContent());
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("POST /api/activities returns 400 when logDate is in the future")
    void createActivityRejectsFutureDate() throws Exception {
        ActivityRequest request = ActivityRequest.builder()
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .quantity(new BigDecimal("10.0000"))
            .unit("km")
            .logDate(LocalDate.now().plusDays(1))
            .build();

        mockMvc.perform(post("/api/activities")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400))
            .andExpect(jsonPath("$.fieldErrors[0].field").value("logDate"));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("PATCH /api/activities/{id} returns 400 when quantity is zero or negative")
    void patchActivityRejectsNonPositiveQuantity() throws Exception {
        PatchActivityRequest request = PatchActivityRequest.builder()
            .quantity(new BigDecimal("-5.0000"))
            .build();

        mockMvc.perform(patch("/api/activities/1")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("POST /api/activities returns 400 on unknown activity type, unit mismatch, or exceeded max")
    void createActivityReturns400OnDomainValidationErrors() throws Exception {
        ActivityRequest request = ActivityRequest.builder()
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("UNKNOWN_MODE")
            .quantity(new BigDecimal("10.0000"))
            .unit("km")
            .logDate(LocalDate.now())
            .build();

        when(activityService.createActivity(any(ActivityRequest.class)))
            .thenThrow(new UnknownActivityTypeException("No active emission factor found"))
            .thenThrow(new UnitMismatchException("Provided unit does not match factor unit"))
            .thenThrow(new InvalidQuantityException("Quantity exceeds maximum allowed quantity"));

        mockMvc.perform(post("/api/activities")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("No active emission factor found"));

        mockMvc.perform(post("/api/activities")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Provided unit does not match factor unit"));

        mockMvc.perform(post("/api/activities")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.message").value("Quantity exceeds maximum allowed quantity"));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("GET /api/activities with invalid category query parameter returns 400 Bad Request")
    void listActivitiesWithInvalidCategoryReturns400() throws Exception {
        mockMvc.perform(get("/api/activities").param("category", "NON_EXISTENT"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
    }
}

