package com.sustainability.activity;

import com.sustainability.activity.dto.ActivityRequest;
import com.sustainability.activity.dto.ActivityResponse;
import com.sustainability.activity.dto.PatchActivityRequest;
import com.sustainability.activity.entity.ActivityLog;
import com.sustainability.activity.mapper.ActivityMapper;
import com.sustainability.activity.repository.ActivityLogRepository;
import com.sustainability.activity.service.ActivityService;
import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.emission.entity.EmissionFactor;
import com.sustainability.emission.service.EmissionCalculator;
import com.sustainability.emission.service.EmissionFactorService;
import com.sustainability.exception.InvalidQuantityException;
import com.sustainability.exception.ResourceNotFoundException;
import com.sustainability.exception.UnitMismatchException;
import com.sustainability.exception.UnknownActivityTypeException;
import com.sustainability.user.entity.Role;
import com.sustainability.user.entity.User;
import com.sustainability.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class ActivityServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private EmissionFactorService emissionFactorService;

    @Spy
    private EmissionCalculator emissionCalculator = new EmissionCalculator();

    @Mock
    private UserRepository userRepository;

    @Spy
    private ActivityMapper activityMapper = new ActivityMapper();

    @InjectMocks
    private ActivityService activityService;

    private User testUser;
    private EmissionFactor transportFactor;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .id(1L)
            .name("Asha Sharma")
            .email("asha@vayu.test")
            .passwordHash("$2a$10$hashed")
            .role(Role.USER)
            .enabled(true)
            .termsAcceptedAt(Instant.now())
            .build();

        transportFactor = EmissionFactor.builder()
            .id(10L)
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .displayName("Petrol Car")
            .unit("km")
            .factorKgCo2e(new BigDecimal("0.170480"))
            .maxQuantity(new BigDecimal("5000.0000"))
            .verified(true)
            .active(true)
            .build();

        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken("asha@vayu.test", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);

        when(userRepository.findByEmail("asha@vayu.test")).thenReturn(Optional.of(testUser));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Create activity stores factor snapshot and returns calculated emission")
    void createActivityStoresFactorSnapshot() {
        ActivityRequest request = ActivityRequest.builder()
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .quantity(new BigDecimal("100.0000"))
            .unit("km")
            .logDate(LocalDate.now())
            .notes("Work commute")
            .build();

        when(emissionFactorService.getActiveFactor("CAR_PETROL", "km")).thenReturn(transportFactor);
        when(activityLogRepository.save(any(ActivityLog.class))).thenAnswer(invocation -> {
            ActivityLog log = invocation.getArgument(0);
            log.setId(100L);
            return log;
        });

        ActivityResponse response = activityService.createActivity(request);

        assertThat(response).isNotNull();
        assertThat(response.getEmissionKgCo2e()).isEqualTo(new BigDecimal("17.0480"));

        ArgumentCaptor<ActivityLog> logCaptor = ArgumentCaptor.forClass(ActivityLog.class);
        verify(activityLogRepository).save(logCaptor.capture());
        ActivityLog savedLog = logCaptor.getValue();
        assertThat(savedLog.getFactorUsed()).isEqualTo(transportFactor.getFactorKgCo2e());
    }

    @Test
    @DisplayName("Create activity rejects zero quantity with InvalidQuantityException")
    void createActivityRejectsZeroQuantity() {
        ActivityRequest request = ActivityRequest.builder()
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .quantity(BigDecimal.ZERO)
            .unit("km")
            .logDate(LocalDate.now())
            .build();

        when(emissionFactorService.getActiveFactor("CAR_PETROL", "km")).thenReturn(transportFactor);

        assertThatThrownBy(() -> activityService.createActivity(request))
            .isInstanceOf(InvalidQuantityException.class)
            .hasMessageContaining("greater than 0");
    }

    @Test
    @DisplayName("Create activity rejects negative quantity with InvalidQuantityException")
    void createActivityRejectsNegativeQuantity() {
        ActivityRequest request = ActivityRequest.builder()
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .quantity(new BigDecimal("-15.0000"))
            .unit("km")
            .logDate(LocalDate.now())
            .build();

        when(emissionFactorService.getActiveFactor("CAR_PETROL", "km")).thenReturn(transportFactor);

        assertThatThrownBy(() -> activityService.createActivity(request))
            .isInstanceOf(InvalidQuantityException.class)
            .hasMessageContaining("greater than 0");
    }

    @Test
    @DisplayName("Create activity rejects quantity above max_quantity with InvalidQuantityException")
    void createActivityRejectsAboveMaxQuantity() {
        ActivityRequest request = ActivityRequest.builder()
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .quantity(new BigDecimal("5001.0000"))
            .unit("km")
            .logDate(LocalDate.now())
            .build();

        when(emissionFactorService.getActiveFactor("CAR_PETROL", "km")).thenReturn(transportFactor);

        assertThatThrownBy(() -> activityService.createActivity(request))
            .isInstanceOf(InvalidQuantityException.class)
            .hasMessageContaining("exceeds maximum allowed quantity");
    }

    @Test
    @DisplayName("Create activity rejects future log date with IllegalArgumentException")
    void createActivityRejectsFutureDate() {
        ActivityRequest request = ActivityRequest.builder()
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .quantity(new BigDecimal("50.0000"))
            .unit("km")
            .logDate(LocalDate.now().plusDays(2))
            .build();

        assertThatThrownBy(() -> activityService.createActivity(request))
            .isInstanceOf(IllegalArgumentException.class)
            .hasMessageContaining("future");
    }

    @Test
    @DisplayName("Create activity rejects unit mismatch with UnitMismatchException")
    void createActivityRejectsUnitMismatch() {
        ActivityRequest request = ActivityRequest.builder()
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .quantity(new BigDecimal("50.0000"))
            .unit("miles")
            .logDate(LocalDate.now())
            .build();

        when(emissionFactorService.getActiveFactor("CAR_PETROL", "miles")).thenReturn(transportFactor);

        assertThatThrownBy(() -> activityService.createActivity(request))
            .isInstanceOf(UnitMismatchException.class)
            .hasMessageContaining("does not match factor unit");
    }

    @Test
    @DisplayName("Create activity rejects category mismatch with UnknownActivityTypeException")
    void createActivityRejectsWrongCategory() {
        ActivityRequest request = ActivityRequest.builder()
            .category(ActivityCategory.FOOD)
            .activityType("CAR_PETROL")
            .quantity(new BigDecimal("50.0000"))
            .unit("km")
            .logDate(LocalDate.now())
            .build();

        when(emissionFactorService.getActiveFactor("CAR_PETROL", "km")).thenReturn(transportFactor);

        assertThatThrownBy(() -> activityService.createActivity(request))
            .isInstanceOf(UnknownActivityTypeException.class)
            .hasMessageContaining("does not match factor category");
    }

    @Test
    @DisplayName("Get activity by id enforces ownership and returns 404 for another user's activity")
    void getActivityEnforcesOwnership() {
        when(activityLogRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> activityService.getActivityById(999L))
            .isInstanceOf(ResourceNotFoundException.class)
            .hasMessageContaining("999");
    }

    @Test
    @DisplayName("Update activity recalculates emissions and stores new factor snapshot")
    void updateActivityRecalculatesEmissions() {
        ActivityLog existingLog = ActivityLog.builder()
            .id(100L)
            .user(testUser)
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .emissionFactor(transportFactor)
            .quantity(new BigDecimal("50.0000"))
            .unit("km")
            .factorUsed(transportFactor.getFactorKgCo2e())
            .emissionKgCo2e(new BigDecimal("8.5240"))
            .logDate(LocalDate.now())
            .build();

        when(activityLogRepository.findByIdAndUserId(100L, 1L)).thenReturn(Optional.of(existingLog));
        when(emissionFactorService.getActiveFactor("CAR_PETROL", "km")).thenReturn(transportFactor);
        when(activityLogRepository.save(any(ActivityLog.class))).thenAnswer(i -> i.getArgument(0));

        ActivityRequest updateRequest = ActivityRequest.builder()
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .quantity(new BigDecimal("200.0000"))
            .unit("km")
            .logDate(LocalDate.now())
            .notes("Updated distance")
            .build();

        ActivityResponse updated = activityService.updateActivity(100L, updateRequest);

        assertThat(updated.getEmissionKgCo2e()).isEqualTo(new BigDecimal("34.0960"));
        assertThat(existingLog.getQuantity()).isEqualTo(new BigDecimal("200.0000"));
    }

    @Test
    @DisplayName("List activities delegates category and date filters for authenticated user")
    void listActivitiesPassesFilters() {
        LocalDate from = LocalDate.now().minusDays(7);
        LocalDate to = LocalDate.now();
        Pageable pageable = PageRequest.of(0, 20);
        ActivityLog existingLog = ActivityLog.builder()
            .id(101L)
            .user(testUser)
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .emissionFactor(transportFactor)
            .quantity(new BigDecimal("25.0000"))
            .unit("km")
            .factorUsed(transportFactor.getFactorKgCo2e())
            .emissionKgCo2e(new BigDecimal("4.2620"))
            .logDate(to)
            .build();

        when(activityLogRepository.findFilteredActivities(1L, ActivityCategory.TRANSPORTATION, from, to, pageable))
            .thenReturn(new PageImpl<>(List.of(existingLog)));

        Page<ActivityResponse> page = activityService.listActivities(ActivityCategory.TRANSPORTATION, from, to, pageable);

        assertThat(page.getContent()).hasSize(1);
        assertThat(page.getContent().get(0).getActivityType()).isEqualTo("CAR_PETROL");
    }

    @Test
    @DisplayName("Patch activity with notes only preserves emission without factor lookup; quantity patch recalculates")
    void patchActivityNotesOnlyAndQuantityRecalculation() {
        ActivityLog existingLog = ActivityLog.builder()
            .id(102L)
            .user(testUser)
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .emissionFactor(transportFactor)
            .quantity(new BigDecimal("50.0000"))
            .unit("km")
            .factorUsed(transportFactor.getFactorKgCo2e())
            .emissionKgCo2e(new BigDecimal("8.5240"))
            .logDate(LocalDate.now())
            .build();

        when(activityLogRepository.findByIdAndUserId(102L, 1L)).thenReturn(Optional.of(existingLog));
        when(activityLogRepository.save(any(ActivityLog.class))).thenAnswer(i -> i.getArgument(0));

        ActivityResponse notesPatched = activityService.patchActivity(
            102L,
            PatchActivityRequest.builder().notes("Airport ride").build()
        );
        assertThat(notesPatched.getNotes()).isEqualTo("Airport ride");
        assertThat(notesPatched.getEmissionKgCo2e()).isEqualTo(new BigDecimal("8.5240"));
        verify(emissionFactorService, never()).getActiveFactor(any(), any());

        when(emissionFactorService.getActiveFactor("CAR_PETROL", "km")).thenReturn(transportFactor);
        ActivityResponse qtyPatched = activityService.patchActivity(
            102L,
            PatchActivityRequest.builder().quantity(new BigDecimal("100.0000")).build()
        );
        assertThat(qtyPatched.getEmissionKgCo2e()).isEqualTo(new BigDecimal("17.0480"));
    }

    @Test
    @DisplayName("Delete activity deletes owned record and throws 404 for another user's activity")
    void deleteActivityEnforcesOwnership() {
        ActivityLog existingLog = ActivityLog.builder().id(103L).user(testUser).build();
        when(activityLogRepository.findByIdAndUserId(103L, 1L)).thenReturn(Optional.of(existingLog));
        when(activityLogRepository.findByIdAndUserId(999L, 1L)).thenReturn(Optional.empty());

        activityService.deleteActivity(103L);
        verify(activityLogRepository).delete(existingLog);

        assertThatThrownBy(() -> activityService.deleteActivity(999L))
            .isInstanceOf(ResourceNotFoundException.class);
    }
}

