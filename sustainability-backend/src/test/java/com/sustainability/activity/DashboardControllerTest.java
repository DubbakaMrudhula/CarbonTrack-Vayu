package com.sustainability.activity;

import com.sustainability.activity.controller.DashboardController;
import com.sustainability.activity.dto.CategoryTotalDto;
import com.sustainability.activity.dto.DashboardSummaryResponse;
import com.sustainability.activity.service.DashboardService;
import com.sustainability.auth.security.AuthEntryPoint;
import com.sustainability.auth.security.JwtAuthenticationFilter;
import com.sustainability.auth.security.JwtService;
import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.exception.GlobalExceptionHandler;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = DashboardController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({GlobalExceptionHandler.class})
public class DashboardControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private AuthEntryPoint authEntryPoint;

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("GET /api/dashboard/summary returns 200 OK with totals and category breakdown")
    void getSummaryReturns200() throws Exception {
        LocalDate date = LocalDate.of(2026, 11, 11);
        DashboardSummaryResponse response = DashboardSummaryResponse.builder()
            .date(date)
            .totalEmissionKgCo2e(new BigDecimal("80.1240"))
            .totalActivityCount(2L)
            .recentActivities(List.of())
            .categoryTotals(List.of(
                new CategoryTotalDto(ActivityCategory.ELECTRICITY, new BigDecimal("71.6000")),
                new CategoryTotalDto(ActivityCategory.TRANSPORTATION, new BigDecimal("8.5240"))
            ))
            .build();

        when(dashboardService.getSummary(date)).thenReturn(response);

        mockMvc.perform(get("/api/dashboard/summary").param("date", "2026-11-11"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalEmissionKgCo2e").value(80.124))
            .andExpect(jsonPath("$.totalActivityCount").value(2))
            .andExpect(jsonPath("$.categoryTotals[0].category").value("ELECTRICITY"));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("GET /api/dashboard/summary with malformed date parameter returns 400 Bad Request")
    void getSummaryWithInvalidDateReturns400() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary").param("date", "not-a-date"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
    }
}

