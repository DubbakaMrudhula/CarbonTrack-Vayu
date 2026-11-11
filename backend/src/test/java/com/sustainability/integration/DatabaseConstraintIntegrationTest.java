package com.sustainability.integration;

import com.sustainability.activity.entity.ActivityLog;
import com.sustainability.activity.repository.ActivityLogRepository;
import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.emission.entity.EmissionFactor;
import com.sustainability.emission.repository.EmissionFactorRepository;
import com.sustainability.user.entity.Role;
import com.sustainability.user.entity.User;
import com.sustainability.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.test.context.DynamicPropertyRegistry;
import org.springframework.test.context.DynamicPropertySource;
import org.testcontainers.containers.PostgreSQLContainer;
import org.testcontainers.junit.jupiter.Container;
import org.testcontainers.junit.jupiter.Testcontainers;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

@SpringBootTest
@Testcontainers
@ActiveProfiles("test")
public class DatabaseConstraintIntegrationTest {

    @Container
    static PostgreSQLContainer<?> postgres = new PostgreSQLContainer<>("postgres:16-alpine")
        .withDatabaseName("vayu_test")
        .withUsername("vayu_test")
        .withPassword("vayu_test");

    @DynamicPropertySource
    static void configureProperties(DynamicPropertyRegistry registry) {
        registry.add("spring.datasource.url", postgres::getJdbcUrl);
        registry.add("spring.datasource.username", postgres::getUsername);
        registry.add("spring.datasource.password", postgres::getPassword);
    }

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private EmissionFactorRepository emissionFactorRepository;

    @Autowired
    private ActivityLogRepository activityLogRepository;

    @Test
    @DisplayName("Context loads, Flyway applies migrations V1 to V5 and seeded factors exist")
    void contextLoadsAndFlywayMigrationsApplied() {
        assertThat(postgres.isRunning()).isTrue();
        long factorCount = emissionFactorRepository.count();
        // 6 verified + 16 unverified TODO factors = 22 total seeded factors
        assertThat(factorCount).isGreaterThanOrEqualTo(22);
    }

    @Test
    @DisplayName("Duplicate user email is rejected by unique constraint")
    void duplicateEmailIsRejected() {
        String email = "duplicate.test@vayu.test";

        User user1 = User.builder()
            .name("User One")
            .email(email)
            .passwordHash("$2a$10$abcdefghijklmnopqrstuv")
            .role(Role.USER)
            .enabled(true)
            .termsAcceptedAt(Instant.now())
            .build();
        userRepository.saveAndFlush(user1);

        User user2 = User.builder()
            .name("User Two")
            .email(email)
            .passwordHash("$2a$10$abcdefghijklmnopqrstuv")
            .role(Role.USER)
            .enabled(true)
            .termsAcceptedAt(Instant.now())
            .build();

        assertThatThrownBy(() -> userRepository.saveAndFlush(user2))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Activity log quantity must be strictly greater than zero")
    void activityLogQuantityMustBeGreaterThanZero() {
        User user = userRepository.saveAndFlush(User.builder()
            .name("Quantity Check User")
            .email("quantity.check@vayu.test")
            .passwordHash("$2a$10$abcdefghijklmnopqrstuv")
            .role(Role.USER)
            .enabled(true)
            .termsAcceptedAt(Instant.now())
            .build());

        EmissionFactor factor = emissionFactorRepository.findByActivityTypeAndUnitAndActiveTrue(
            "ELECTRICITY_GRID",
            "kWh"
        ).orElseThrow();

        ActivityLog invalidLog = ActivityLog.builder()
            .user(user)
            .category(ActivityCategory.ELECTRICITY)
            .activityType(factor.getActivityType())
            .emissionFactor(factor)
            .quantity(BigDecimal.ZERO)
            .unit(factor.getUnit())
            .factorUsed(factor.getFactorKgCo2e())
            .emissionKgCo2e(BigDecimal.ZERO)
            .logDate(LocalDate.now())
            .build();

        assertThatThrownBy(() -> activityLogRepository.saveAndFlush(invalidLog))
            .isInstanceOf(DataIntegrityViolationException.class);
    }

    @Test
    @DisplayName("Deleting a user cascades and deletes all associated activity logs")
    void deletingUserCascadesToActivityLogs() {
        User user = userRepository.saveAndFlush(User.builder()
            .name("Cascade User")
            .email("cascade.user@vayu.test")
            .passwordHash("$2a$10$abcdefghijklmnopqrstuv")
            .role(Role.USER)
            .enabled(true)
            .termsAcceptedAt(Instant.now())
            .build());

        EmissionFactor factor = emissionFactorRepository.findByActivityTypeAndUnitAndActiveTrue(
            "ELECTRICITY_GRID",
            "kWh"
        ).orElseThrow();

        ActivityLog log = activityLogRepository.saveAndFlush(ActivityLog.builder()
            .user(user)
            .category(ActivityCategory.ELECTRICITY)
            .activityType(factor.getActivityType())
            .emissionFactor(factor)
            .quantity(new BigDecimal("10.5000"))
            .unit(factor.getUnit())
            .factorUsed(factor.getFactorKgCo2e())
            .emissionKgCo2e(new BigDecimal("7.5180"))
            .logDate(LocalDate.now())
            .build());

        Long logId = log.getId();
        Long userId = user.getId();

        userRepository.deleteById(userId);
        userRepository.flush();

        Optional<ActivityLog> fetchedLog = activityLogRepository.findById(logId);
        assertThat(fetchedLog).isEmpty();
    }

    @Test
    @DisplayName("Deleting a referenced emission factor is restricted by foreign key constraint")
    void deletingReferencedEmissionFactorIsRestricted() {
        User user = userRepository.saveAndFlush(User.builder()
            .name("FK Restrict User")
            .email("fk.restrict@vayu.test")
            .passwordHash("$2a$10$abcdefghijklmnopqrstuv")
            .role(Role.USER)
            .enabled(true)
            .termsAcceptedAt(Instant.now())
            .build());

        EmissionFactor customFactor = emissionFactorRepository.saveAndFlush(EmissionFactor.builder()
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CUSTOM_CAR_TEST")
            .displayName("Custom Car Test")
            .unit("km")
            .factorKgCo2e(new BigDecimal("0.150000"))
            .maxQuantity(new BigDecimal("5000.0000"))
            .sourceName("Test Source")
            .sourceYear("2026")
            .sourceUrl("https://example.test")
            .verified(true)
            .active(true)
            .build());

        activityLogRepository.saveAndFlush(ActivityLog.builder()
            .user(user)
            .category(ActivityCategory.TRANSPORTATION)
            .activityType(customFactor.getActivityType())
            .emissionFactor(customFactor)
            .quantity(new BigDecimal("25.0000"))
            .unit(customFactor.getUnit())
            .factorUsed(customFactor.getFactorKgCo2e())
            .emissionKgCo2e(new BigDecimal("3.7500"))
            .logDate(LocalDate.now())
            .build());

        assertThatThrownBy(() -> {
            emissionFactorRepository.delete(customFactor);
            emissionFactorRepository.flush();
        }).isInstanceOf(DataIntegrityViolationException.class);
    }
}

