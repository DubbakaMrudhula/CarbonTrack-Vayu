package com.sustainability.emission;

import com.sustainability.auth.security.AuthEntryPoint;
import com.sustainability.auth.security.JwtAuthenticationFilter;
import com.sustainability.auth.security.JwtService;
import com.sustainability.emission.controller.EmissionFactorController;
import com.sustainability.emission.dto.EmissionFactorResponse;
import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.emission.service.EmissionFactorService;
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
import java.util.List;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = EmissionFactorController.class)
@AutoConfigureMockMvc(addFilters = false)
@Import({GlobalExceptionHandler.class})
public class EmissionFactorControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private EmissionFactorService emissionFactorService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private JwtAuthenticationFilter jwtAuthenticationFilter;

    @MockBean
    private AuthEntryPoint authEntryPoint;

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("GET /api/emission-factors returns all active factors without internal source fields")
    void getAllActiveFactorsReturns200() throws Exception {
        EmissionFactorResponse elec = EmissionFactorResponse.builder()
            .activityType("ELECTRICITY_GRID")
            .displayName("Grid Electricity (India Average)")
            .category(ActivityCategory.ELECTRICITY)
            .unit("kWh")
            .maxQuantity(new BigDecimal("10000.0000"))
            .build();

        when(emissionFactorService.listActiveFactors(null)).thenReturn(List.of(elec));

        mockMvc.perform(get("/api/emission-factors"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].activityType").value("ELECTRICITY_GRID"))
            .andExpect(jsonPath("$[0].unit").value("kWh"))
            .andExpect(jsonPath("$[0].sourceUrl").doesNotExist())
            .andExpect(jsonPath("$[0].verified").doesNotExist())
            .andExpect(jsonPath("$[0].active").doesNotExist());
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("GET /api/emission-factors?category=TRANSPORTATION filters active factors by category")
    void getFactorsFilteredByCategoryReturns200() throws Exception {
        EmissionFactorResponse car = EmissionFactorResponse.builder()
            .activityType("CAR_PETROL")
            .displayName("Petrol Car (Medium)")
            .category(ActivityCategory.TRANSPORTATION)
            .unit("km")
            .maxQuantity(new BigDecimal("5000.0000"))
            .build();

        when(emissionFactorService.listActiveFactors(ActivityCategory.TRANSPORTATION))
            .thenReturn(List.of(car));

        mockMvc.perform(get("/api/emission-factors").param("category", "TRANSPORTATION"))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].category").value("TRANSPORTATION"))
            .andExpect(jsonPath("$[0].activityType").value("CAR_PETROL"));
    }

    @Test
    @WithMockUser(username = "asha@vayu.test")
    @DisplayName("GET /api/emission-factors with invalid category parameter returns 400 Bad Request")
    void invalidCategoryParamReturns400() throws Exception {
        mockMvc.perform(get("/api/emission-factors").param("category", "INVALID_CATEGORY"))
            .andExpect(status().isBadRequest())
            .andExpect(jsonPath("$.status").value(400));
    }
}

