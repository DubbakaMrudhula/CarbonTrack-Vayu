package com.sustainability.activity.dto;

import com.sustainability.emission.entity.ActivityCategory;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.PastOrPresent;
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
public class PatchActivityRequest {

    private ActivityCategory category;

    private String activityType;

    @DecimalMin(value = "0.0001", message = "Quantity must be strictly greater than 0")
    private BigDecimal quantity;

    private String unit;

    @PastOrPresent(message = "Log date cannot be in the future")
    private LocalDate logDate;

    private String notes;
}

