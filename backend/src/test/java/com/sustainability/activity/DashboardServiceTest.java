package com.sustainability.activity;

import com.sustainability.activity.dto.DashboardSummaryResponse;
import com.sustainability.activity.entity.ActivityLog;
import com.sustainability.activity.mapper.ActivityMapper;
import com.sustainability.activity.repository.ActivityLogRepository;
import com.sustainability.activity.service.DashboardService;
import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.user.entity.Role;
import com.sustainability.user.entity.User;
import com.sustainability.user.repository.UserRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;

import java.math.BigDecimal;
import java.time.Instant;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class DashboardServiceTest {

    @Mock
    private ActivityLogRepository activityLogRepository;

    @Mock
    private UserRepository userRepository;

    @Spy
    private ActivityMapper activityMapper = new ActivityMapper();

    @InjectMocks
    private DashboardService dashboardService;

    private User testUser;

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

        SecurityContextHolder.getContext().setAuthentication(
            new UsernamePasswordAuthenticationToken("asha@vayu.test", null, Collections.emptyList())
        );

        when(userRepository.findByEmail("asha@vayu.test")).thenReturn(Optional.of(testUser));
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Empty dashboard returns zero totals and initializes all four categories to 0.0000")
    void emptyDashboardReturnsZeros() {
        LocalDate targetDate = LocalDate.of(2026, 11, 11);

        when(activityLogRepository.sumEmissionsByUserIdAndDate(1L, targetDate))
            .thenReturn(BigDecimal.ZERO.setScale(4));
        when(activityLogRepository.countByUserId(1L)).thenReturn(0L);
        when(activityLogRepository.findTop5ByUserIdOrderByLogDateDescIdDesc(1L))
            .thenReturn(Collections.emptyList());
        when(activityLogRepository.sumEmissionsByCategoryAndDate(1L, targetDate))
            .thenReturn(Collections.emptyList());

        DashboardSummaryResponse summary = dashboardService.getSummary(targetDate);

        assertThat(summary.getDate()).isEqualTo(targetDate);
        assertThat(summary.getTotalEmissionKgCo2e()).isEqualByComparingTo("0.0000");
        assertThat(summary.getTotalActivityCount()).isEqualTo(0L);
        assertThat(summary.getRecentActivities()).isEmpty();
        assertThat(summary.getCategoryTotals()).hasSize(4);
        assertThat(summary.getCategoryTotals())
            .allSatisfy(ct -> assertThat(ct.getTotalEmissionKgCo2e()).isEqualByComparingTo("0.0000"));
    }

    @Test
    @DisplayName("Populated dashboard aggregates totals, categories, and recent logs accurately")
    void populatedDashboardAggregatesTotals() {
        LocalDate targetDate = LocalDate.of(2026, 11, 11);
        ActivityLog elecLog = ActivityLog.builder()
            .id(10L)
            .user(testUser)
            .category(ActivityCategory.ELECTRICITY)
            .activityType("ELECTRICITY_GRID")
            .quantity(new BigDecimal("100.0000"))
            .unit("kWh")
            .factorUsed(new BigDecimal("0.716000"))
            .emissionKgCo2e(new BigDecimal("71.6000"))
            .logDate(targetDate)
            .build();

        when(activityLogRepository.sumEmissionsByUserIdAndDate(1L, targetDate))
            .thenReturn(new BigDecimal("71.6000"));
        when(activityLogRepository.countByUserId(1L)).thenReturn(1L);
        when(activityLogRepository.findTop5ByUserIdOrderByLogDateDescIdDesc(1L))
            .thenReturn(List.of(elecLog));
        when(activityLogRepository.sumEmissionsByCategoryAndDate(1L, targetDate))
            .thenReturn(List.<Object[]>of(new Object[]{ActivityCategory.ELECTRICITY, new BigDecimal("71.6000")}));

        DashboardSummaryResponse summary = dashboardService.getSummary(targetDate);

        assertThat(summary.getTotalEmissionKgCo2e()).isEqualByComparingTo("71.6000");
        assertThat(summary.getTotalActivityCount()).isEqualTo(1L);
        assertThat(summary.getRecentActivities()).hasSize(1);
        assertThat(summary.getCategoryTotals())
            .filteredOn(ct -> ct.getCategory() == ActivityCategory.ELECTRICITY)
            .first()
            .satisfies(ct -> assertThat(ct.getTotalEmissionKgCo2e()).isEqualByComparingTo("71.6000"));
    }
}

