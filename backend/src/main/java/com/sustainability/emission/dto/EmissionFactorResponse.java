package com.sustainability.emission.dto;

import com.sustainability.emission.entity.ActivityCategory;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmissionFactorResponse {

    private String activityType;
    private String displayName;
    private ActivityCategory category;
    private String unit;
    private BigDecimal maxQuantity;
}

