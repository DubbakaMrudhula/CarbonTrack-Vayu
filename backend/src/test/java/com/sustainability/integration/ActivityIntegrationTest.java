package com.sustainability.integration;

import com.sustainability.activity.dto.ActivityRequest;
import com.sustainability.activity.dto.ActivityResponse;
import com.sustainability.activity.dto.DashboardSummaryResponse;
import com.sustainability.auth.dto.AuthResponse;
import com.sustainability.auth.dto.RegisterRequest;
import com.sustainability.emission.entity.ActivityCategory;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.http.HttpEntity;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.LocalDate;

import static org.assertj.core.api.Assertions.assertThat;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
@Testcontainers
@ActiveProfiles("test")
public class ActivityIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("vayu_integration_test")
        .withUsername("vayu_integ")
        .withPassword("vayu_integ");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Test
    @DisplayName("End-to-end integration: register, log activities, read back, and verify dashboard sum")
    void endToEndActivityLoggingAndDashboardSummary() {
        // Step 1: Register a new user
        RegisterRequest registerRequest = RegisterRequest.builder()
            .name("Ravi Kumar")
            .email("ravi.kumar@vayu.test")
            .password("SecurePass789")
            .acceptedTerms(true)
            .build();

        ResponseEntity<AuthResponse> registerResponse = restTemplate.postForEntity(
            "/api/auth/register",
            registerRequest,
            AuthResponse.class
        );

        assertThat(registerResponse.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(registerResponse.getBody()).isNotNull();
        String token = registerResponse.getBody().getToken();
        assertThat(token).isNotBlank();

        HttpHeaders authHeaders = new HttpHeaders();
        authHeaders.setContentType(MediaType.APPLICATION_JSON);
        authHeaders.setBearerAuth(token);

        LocalDate today = LocalDate.now();

        // Step 2: Log first activity (Electricity: 100 kWh @ 0.716000 kg/kWh = 71.6000 kg CO2e)
        ActivityRequest electricityReq = ActivityRequest.builder()
            .category(ActivityCategory.ELECTRICITY)
            .activityType("ELECTRICITY_GRID")
            .quantity(new BigDecimal("100.0000"))
            .unit("kWh")
            .logDate(today)
            .notes("Monthly electricity baseline")
            .build();

        ResponseEntity<ActivityResponse> logResponse1 = restTemplate.postForEntity(
            "/api/activities",
            new HttpEntity<>(electricityReq, authHeaders),
            ActivityResponse.class
        );

        assertThat(logResponse1.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(logResponse1.getBody()).isNotNull();
        Long firstActivityId = logResponse1.getBody().getId();
        BigDecimal emission1 = logResponse1.getBody().getEmissionKgCo2e();
        assertThat(emission1).isEqualByComparingTo(new BigDecimal("71.6000"));

        // Step 3: Log second activity (Transportation: 50 km @ 0.170480 kg/km = 8.5240 kg CO2e)
        ActivityRequest transportReq = ActivityRequest.builder()
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .quantity(new BigDecimal("50.0000"))
            .unit("km")
            .logDate(today)
            .notes("Highway trip")
            .build();

        ResponseEntity<ActivityResponse> logResponse2 = restTemplate.postForEntity(
            "/api/activities",
            new HttpEntity<>(transportReq, authHeaders),
            ActivityResponse.class
        );

        assertThat(logResponse2.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(logResponse2.getBody()).isNotNull();
        BigDecimal emission2 = logResponse2.getBody().getEmissionKgCo2e();
        assertThat(emission2).isEqualByComparingTo(new BigDecimal("8.5240"));

        // Step 4: Read back the first activity via GET /api/activities/{id}
        ResponseEntity<ActivityResponse> fetchResponse = restTemplate.exchange(
            "/api/activities/" + firstActivityId,
            HttpMethod.GET,
            new HttpEntity<>(authHeaders),
            ActivityResponse.class
        );

        assertThat(fetchResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(fetchResponse.getBody()).isNotNull();
        assertThat(fetchResponse.getBody().getActivityType()).isEqualTo("ELECTRICITY_GRID");
        assertThat(fetchResponse.getBody().getQuantity()).isEqualByComparingTo(new BigDecimal("100.0000"));

        // Step 5: Verify GET /api/dashboard/summary?date=YYYY-MM-DD
        ResponseEntity<DashboardSummaryResponse> summaryResponse = restTemplate.exchange(
            "/api/dashboard/summary?date=" + today,
            HttpMethod.GET,
            new HttpEntity<>(authHeaders),
            DashboardSummaryResponse.class
        );

        assertThat(summaryResponse.getStatusCode()).isEqualTo(HttpStatus.OK);
        DashboardSummaryResponse summary = summaryResponse.getBody();
        assertThat(summary).isNotNull();

        // Total emissions must equal sum of the two activities: 71.6000 + 8.5240 = 80.1240
        BigDecimal expectedTotal = emission1.add(emission2);
        assertThat(summary.getTotalEmissionKgCo2e()).isEqualByComparingTo(expectedTotal);
        assertThat(summary.getTotalActivityCount()).isEqualTo(2);
        assertThat(summary.getRecentActivities()).hasSize(2);
    }
}

