package com.sustainability.integration;

import com.fasterxml.jackson.databind.JsonNode;
import com.sustainability.activity.dto.ActivityRequest;
import com.sustainability.activity.dto.ActivityResponse;
import com.sustainability.activity.dto.DashboardSummaryResponse;
import com.sustainability.activity.repository.ActivityLogRepository;
import com.sustainability.auth.dto.AuthResponse;
import com.sustainability.auth.dto.LoginRequest;
import com.sustainability.auth.dto.RegisterRequest;
import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.emission.entity.EmissionFactor;
import com.sustainability.emission.repository.EmissionFactorRepository;
import com.sustainability.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
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
public class FullWorkflowIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("vayu_workflow_test")
        .withUsername("vayu_workflow")
        .withPassword("vayu_workflow");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private TestRestTemplate restTemplate;

    @Autowired
    private EmissionFactorRepository emissionFactorRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Autowired
    private UserRepository userRepository;

    private EmissionFactor testFoodFactor;
    private EmissionFactor testShoppingFactor;

    @BeforeEach
    void setUpFixtures() {
        // Test-only active fixtures for Food and Shopping so V3 migration remains unmodified
        // with real unverified factors inactive.
        testFoodFactor = emissionFactorRepository
            .findByActivityTypeAndUnitAndActiveTrue("TEST_FOOD_WORKFLOW", "serving")
            .orElseGet(() -> emissionFactorRepository.saveAndFlush(EmissionFactor.builder()
                .category(ActivityCategory.FOOD)
                .activityType("TEST_FOOD_WORKFLOW")
                .displayName("Test Meal Fixture")
                .unit("serving")
                .factorKgCo2e(new BigDecimal("1.200000"))
                .maxQuantity(new BigDecimal("20.0000"))
                .sourceName("Integration Test Fixture Only")
                .sourceYear("2026")
                .sourceUrl("https://vayu.test/fixture")
                .verified(true)
                .active(true)
                .build()));

        testShoppingFactor = emissionFactorRepository
            .findByActivityTypeAndUnitAndActiveTrue("TEST_SHOPPING_WORKFLOW", "INR")
            .orElseGet(() -> emissionFactorRepository.saveAndFlush(EmissionFactor.builder()
                .category(ActivityCategory.SHOPPING)
                .activityType("TEST_SHOPPING_WORKFLOW")
                .displayName("Test Shopping Fixture")
                .unit("INR")
                .factorKgCo2e(new BigDecimal("0.000500"))
                .maxQuantity(new BigDecimal("1000000.0000"))
                .sourceName("Integration Test Fixture Only")
                .sourceYear("2026")
                .sourceUrl("https://vayu.test/fixture")
                .verified(true)
                .active(true)
                .build()));
    }

    @AfterEach
    void tearDown() {
        activityLogRepository.deleteAll();
        userRepository.deleteAll();
        if (testFoodFactor != null && testFoodFactor.getId() != null) {
            emissionFactorRepository.deleteById(testFoodFactor.getId());
        }
        if (testShoppingFactor != null && testShoppingFactor.getId() != null) {
            emissionFactorRepository.deleteById(testShoppingFactor.getId());
        }
    }

    @Test
    @DisplayName("Full workflow: register, login, create all 4 categories, list, edit, delete, summary")
    void fullUserWorkflowAcrossAllFourCategories() {
        String email = "workflow.user@vayu.test";
        String password = "WorkflowPass123";

        // 1. Register
        RegisterRequest registerReq = RegisterRequest.builder()
            .name("Meera Nair")
            .email(email)
            .password(password)
            .acceptedTerms(true)
            .build();
        ResponseEntity<AuthResponse> registerRes = restTemplate.postForEntity(
            "/api/auth/register",
            registerReq,
            AuthResponse.class
        );
        assertThat(registerRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);

        // 2. Login
        LoginRequest loginReq = LoginRequest.builder()
            .email(email)
            .password(password)
            .build();
        ResponseEntity<AuthResponse> loginRes = restTemplate.postForEntity(
            "/api/auth/login",
            loginReq,
            AuthResponse.class
        );
        assertThat(loginRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(loginRes.getBody()).isNotNull();
        String jwt = loginRes.getBody().getToken();

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_JSON);
        headers.setBearerAuth(jwt);

        LocalDate today = LocalDate.now();

        // 3. Create one activity in each of the 4 categories
        // 3a. TRANSPORTATION: 50 km * 0.170480 = 8.5240
        ResponseEntity<ActivityResponse> transportRes = restTemplate.postForEntity(
            "/api/activities",
            new HttpEntity<>(ActivityRequest.builder()
                .category(ActivityCategory.TRANSPORTATION)
                .activityType("CAR_PETROL")
                .quantity(new BigDecimal("50.0000"))
                .unit("km")
                .logDate(today)
                .notes("Commute")
                .build(), headers),
            ActivityResponse.class
        );
        assertThat(transportRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(transportRes.getBody().getEmissionKgCo2e()).isEqualByComparingTo("8.5240");
        Long transportId = transportRes.getBody().getId();

        // 3b. ELECTRICITY: 100 kWh * 0.716000 = 71.6000
        ResponseEntity<ActivityResponse> electricityRes = restTemplate.postForEntity(
            "/api/activities",
            new HttpEntity<>(ActivityRequest.builder()
                .category(ActivityCategory.ELECTRICITY)
                .activityType("ELECTRICITY_GRID")
                .quantity(new BigDecimal("100.0000"))
                .unit("kWh")
                .logDate(today)
                .build(), headers),
            ActivityResponse.class
        );
        assertThat(electricityRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(electricityRes.getBody().getEmissionKgCo2e()).isEqualByComparingTo("71.6000");

        // 3c. FOOD: 2 servings * 1.200000 = 2.4000
        ResponseEntity<ActivityResponse> foodRes = restTemplate.postForEntity(
            "/api/activities",
            new HttpEntity<>(ActivityRequest.builder()
                .category(ActivityCategory.FOOD)
                .activityType("TEST_FOOD_WORKFLOW")
                .quantity(new BigDecimal("2.0000"))
                .unit("serving")
                .logDate(today)
                .build(), headers),
            ActivityResponse.class
        );
        assertThat(foodRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(foodRes.getBody().getEmissionKgCo2e()).isEqualByComparingTo("2.4000");
        Long foodId = foodRes.getBody().getId();

        // 3d. SHOPPING: 2000 INR * 0.000500 = 1.0000
        ResponseEntity<ActivityResponse> shoppingRes = restTemplate.postForEntity(
            "/api/activities",
            new HttpEntity<>(ActivityRequest.builder()
                .category(ActivityCategory.SHOPPING)
                .activityType("TEST_SHOPPING_WORKFLOW")
                .quantity(new BigDecimal("2000.0000"))
                .unit("INR")
                .logDate(today)
                .build(), headers),
            ActivityResponse.class
        );
        assertThat(shoppingRes.getStatusCode()).isEqualTo(HttpStatus.CREATED);
        assertThat(shoppingRes.getBody().getEmissionKgCo2e()).isEqualByComparingTo("1.0000");

        // 4. List activities (filtered by FOOD category)
        ResponseEntity<JsonNode> listFilteredRes = restTemplate.exchange(
            "/api/activities?category=FOOD",
            HttpMethod.GET,
            new HttpEntity<>(headers),
            JsonNode.class
        );
        assertThat(listFilteredRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(listFilteredRes.getBody().get("totalElements").asInt()).isEqualTo(1);
        assertThat(listFilteredRes.getBody().get("content").get(0).get("activityType").asText())
            .isEqualTo("TEST_FOOD_WORKFLOW");

        // 5. Edit transportation activity: 100 km * 0.170480 = 17.0480
        ResponseEntity<ActivityResponse> editRes = restTemplate.exchange(
            "/api/activities/" + transportId,
            HttpMethod.PUT,
            new HttpEntity<>(ActivityRequest.builder()
                .category(ActivityCategory.TRANSPORTATION)
                .activityType("CAR_PETROL")
                .quantity(new BigDecimal("100.0000"))
                .unit("km")
                .logDate(today)
                .notes("Updated commute distance")
                .build(), headers),
            ActivityResponse.class
        );
        assertThat(editRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(editRes.getBody().getEmissionKgCo2e()).isEqualByComparingTo("17.0480");

        // 6. Delete food activity and confirm 404 on subsequent lookup
        ResponseEntity<Void> deleteRes = restTemplate.exchange(
            "/api/activities/" + foodId,
            HttpMethod.DELETE,
            new HttpEntity<>(headers),
            Void.class
        );
        assertThat(deleteRes.getStatusCode()).isEqualTo(HttpStatus.NO_CONTENT);

        ResponseEntity<JsonNode> afterDeleteGet = restTemplate.exchange(
            "/api/activities/" + foodId,
            HttpMethod.GET,
            new HttpEntity<>(headers),
            JsonNode.class
        );
        assertThat(afterDeleteGet.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);

        // 7. Verify dashboard summary reflects remaining 3 activities:
        // 17.0480 (Transport) + 71.6000 (Electricity) + 1.0000 (Shopping) = 89.6480 kg CO2e
        ResponseEntity<DashboardSummaryResponse> summaryRes = restTemplate.exchange(
            "/api/dashboard/summary?date=" + today,
            HttpMethod.GET,
            new HttpEntity<>(headers),
            DashboardSummaryResponse.class
        );
        assertThat(summaryRes.getStatusCode()).isEqualTo(HttpStatus.OK);
        DashboardSummaryResponse summary = summaryRes.getBody();
        assertThat(summary).isNotNull();
        assertThat(summary.getTotalActivityCount()).isEqualTo(3);
        assertThat(summary.getTotalEmissionKgCo2e()).isEqualByComparingTo("89.6480");
        assertThat(summary.getCategoryTotals())
            .filteredOn(ct -> ct.getCategory() == ActivityCategory.FOOD)
            .first()
            .satisfies(ct -> assertThat(ct.getTotalEmissionKgCo2e()).isEqualByComparingTo("0.0000"));
    }
}

