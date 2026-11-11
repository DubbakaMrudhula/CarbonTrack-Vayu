package com.sustainability.activity.dto;

import com.sustainability.emission.entity.ActivityCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ActivityResponse {

    private Long id;
    private ActivityCategory category;
    private String activityType;
    private String displayName;
    private BigDecimal quantity;
    private String unit;
    private BigDecimal emissionKgCo2e;
    private LocalDate logDate;
    private String notes;
}

