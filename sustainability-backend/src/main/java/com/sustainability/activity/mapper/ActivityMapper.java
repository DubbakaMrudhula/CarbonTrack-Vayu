package com.sustainability.activity.mapper;

import com.sustainability.activity.dto.ActivityResponse;
import com.sustainability.activity.entity.ActivityLog;
import org.springframework.stereotype.Component;

@Component
public class ActivityMapper {

    public ActivityResponse toResponse(ActivityLog log) {
        if (log == null) {
            return null;
        }

        String displayName = (log.getEmissionFactor() != null)
            ? log.getEmissionFactor().getDisplayName()
            : log.getActivityType();

        return ActivityResponse.builder()
            .id(log.getId())
            .category(log.getCategory())
            .activityType(log.getActivityType())
            .displayName(displayName)
            .quantity(log.getQuantity())
            .unit(log.getUnit())
            .emissionKgCo2e(log.getEmissionKgCo2e())
            .logDate(log.getLogDate())
            .notes(log.getNotes())
            .build();
    }
}

