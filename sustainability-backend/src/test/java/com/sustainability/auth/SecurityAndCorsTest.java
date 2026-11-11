package com.sustainability.auth;

import com.sustainability.activity.controller.DashboardController;
import com.sustainability.activity.dto.DashboardSummaryResponse;
import com.sustainability.activity.service.DashboardService;
import com.sustainability.auth.security.AuthEntryPoint;
import com.sustainability.auth.security.CustomUserDetails;
import com.sustainability.auth.security.CustomUserDetailsService;
import com.sustainability.auth.security.JwtAuthenticationFilter;
import com.sustainability.auth.security.JwtService;
import com.sustainability.config.AppProperties;
import com.sustainability.config.CorsConfig;
import com.sustainability.config.SecurityConfig;
import com.sustainability.exception.GlobalExceptionHandler;
import com.sustainability.user.entity.Role;
import com.sustainability.user.entity.User;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.HttpHeaders;
import org.springframework.test.context.TestPropertySource;
import org.springframework.test.web.servlet.MockMvc;

import javax.crypto.SecretKey;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Date;
import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.options;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(controllers = DashboardController.class)
@Import({
    SecurityConfig.class,
    CorsConfig.class,
    AppProperties.class,
    JwtService.class,
    JwtAuthenticationFilter.class,
    AuthEntryPoint.class,
    GlobalExceptionHandler.class
})
@TestPropertySource(properties = {
    "app.cors.allowed-origins=http://localhost:5173",
    "app.jwt.secret=test_environment_secret_key_must_be_at_least_256_bits_long_for_vayu_test_suite_2026",
    "app.jwt.expiration-ms=3600000"
})
public class SecurityAndCorsTest {

    private static final String TEST_SECRET =
        "test_environment_secret_key_must_be_at_least_256_bits_long_for_vayu_test_suite_2026";

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private JwtService jwtService;

    @MockBean
    private DashboardService dashboardService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("Protected endpoint returns 401 JSON when Authorization header is missing")
    void missingTokenReturns401Json() throws Exception {
        mockMvc.perform(get("/api/dashboard/summary"))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401))
            .andExpect(jsonPath("$.path").value("/api/dashboard/summary"));
    }

    @Test
    @DisplayName("Protected endpoint returns 401 when Bearer token is expired")
    void expiredTokenReturns401() throws Exception {
        SecretKey key = Keys.hmacShaKeyFor(TEST_SECRET.getBytes(StandardCharsets.UTF_8));
        Instant past = Instant.now().minusSeconds(600);
        String expiredJwt = Jwts.builder()
            .subject("asha@vayu.test")
            .issuedAt(Date.from(past.minusSeconds(3600)))
            .expiration(Date.from(past))
            .signWith(key, Jwts.SIG.HS256)
            .compact();

        mockMvc.perform(get("/api/dashboard/summary")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + expiredJwt))
            .andExpect(status().isUnauthorized())
            .andExpect(jsonPath("$.status").value(401));
    }

    @Test
    @DisplayName("Protected endpoint succeeds with valid Bearer JWT")
    void validTokenAuthenticatesRequest() throws Exception {
        User user = User.builder()
            .id(1L)
            .name("Asha Sharma")
            .email("asha@vayu.test")
            .passwordHash("hashed")
            .role(Role.USER)
            .enabled(true)
            .build();

        when(customUserDetailsService.loadUserByUsername("asha@vayu.test"))
            .thenReturn(new CustomUserDetails(user));
        when(dashboardService.getSummary(any())).thenReturn(DashboardSummaryResponse.builder()
            .date(LocalDate.now())
            .totalEmissionKgCo2e(BigDecimal.ZERO)
            .totalActivityCount(0)
            .recentActivities(List.of())
            .categoryTotals(List.of())
            .build());

        String validJwt = jwtService.generateToken("asha@vayu.test");

        mockMvc.perform(get("/api/dashboard/summary")
                .header(HttpHeaders.AUTHORIZATION, "Bearer " + validJwt))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$.totalActivityCount").value(0));
    }

    @Test
    @DisplayName("CORS preflight allows http://localhost:5173 and rejects untrusted origins")
    void corsPreflightAllowsConfiguredOrigin() throws Exception {
        mockMvc.perform(options("/api/dashboard/summary")
                .header(HttpHeaders.ORIGIN, "http://localhost:5173")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_HEADERS, "Authorization, Content-Type"))
            .andExpect(status().isOk())
            .andExpect(header().string(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN, "http://localhost:5173"));

        mockMvc.perform(options("/api/dashboard/summary")
                .header(HttpHeaders.ORIGIN, "https://untrusted.test")
                .header(HttpHeaders.ACCESS_CONTROL_REQUEST_METHOD, "GET"))
            .andExpect(header().doesNotExist(HttpHeaders.ACCESS_CONTROL_ALLOW_ORIGIN));
    }
}

