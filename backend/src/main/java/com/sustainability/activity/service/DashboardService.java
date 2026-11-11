package com.sustainability.activity.service;

import com.sustainability.activity.dto.CategoryTotalDto;
import com.sustainability.activity.dto.DashboardSummaryResponse;
import com.sustainability.activity.entity.ActivityLog;
import com.sustainability.activity.mapper.ActivityMapper;
import com.sustainability.activity.repository.ActivityLogRepository;
import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.exception.ResourceNotFoundException;
import com.sustainability.user.entity.User;
import com.sustainability.user.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;

/**
 * Note: This is an initial simple dashboard aggregation service using basic JPQL queries
 * for Weeks 1 and 2. It will be superseded in Weeks 3 and 4 by the dedicated analytics engine.
 * No caching or trends are included at this phase.
 */
@Service
public class DashboardService {

    private final ActivityLogRepository activityLogRepository;
    private final UserRepository userRepository;
    private final ActivityMapper activityMapper;

    public DashboardService(
        ActivityLogRepository activityLogRepository,
        UserRepository userRepository,
        ActivityMapper activityMapper
    ) {
        this.activityLogRepository = activityLogRepository;
        this.userRepository = userRepository;
        this.activityMapper = activityMapper;
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new BadCredentialsException("No authenticated user in security context");
        }
        String email = auth.getName().toLowerCase().trim();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found: " + email));
    }

    @Transactional(readOnly = true)
    public DashboardSummaryResponse getSummary(LocalDate clientDate) {
        User user = getAuthenticatedUser();
        LocalDate targetDate = (clientDate != null) ? clientDate : LocalDate.now();

        BigDecimal todayTotalEmissions = activityLogRepository.sumEmissionsByUserIdAndDate(
            user.getId(),
            targetDate
        );

        long totalActivities = activityLogRepository.countByUserId(user.getId());

        List<ActivityLog> recentLogs = activityLogRepository.findTop5ByUserIdOrderByLogDateDescIdDesc(
            user.getId()
        );

        Map<ActivityCategory, BigDecimal> categoryMap = new EnumMap<>(ActivityCategory.class);
        for (ActivityCategory category : ActivityCategory.values()) {
            categoryMap.put(category, BigDecimal.ZERO.setScale(4));
        }

        List<Object[]> rawCategorySums = activityLogRepository.sumEmissionsByCategoryAndDate(
            user.getId(),
            targetDate
        );
        for (Object[] row : rawCategorySums) {
            ActivityCategory cat = (ActivityCategory) row[0];
            BigDecimal sum = (BigDecimal) row[1];
            categoryMap.put(cat, sum);
        }

        List<CategoryTotalDto> categoryTotals = categoryMap.entrySet().stream()
            .map(entry -> CategoryTotalDto.builder()
                .category(entry.getKey())
                .totalEmissionKgCo2e(entry.getValue())
                .build())
            .toList();

        return DashboardSummaryResponse.builder()
            .date(targetDate)
            .totalEmissionKgCo2e(todayTotalEmissions)
            .totalActivityCount(totalActivities)
            .recentActivities(recentLogs.stream().map(activityMapper::toResponse).toList())
            .categoryTotals(categoryTotals)
            .build();
    }
}

