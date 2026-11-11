package com.sustainability.user.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
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
public class UserPreferencesRequest {

    @NotBlank(message = "Country is required")
    private String country;

    private String region;

    @NotBlank(message = "Currency is required")
    @Pattern(regexp = "^(INR|USD)$", message = "Currency must be INR or USD")
    private String currency;

    @NotBlank(message = "Diet type is required")
    private String dietType;

    @NotBlank(message = "Primary transport is required")
    private String primaryTransport;

    @NotNull(message = "Household size is required")
    @Min(value = 1, message = "Household size must be at least 1")
    @Max(value = 20, message = "Household size must be at most 20")
    private Integer householdSize;

    @NotBlank(message = "Focus categories are required")
    private String focusCategories;

    @DecimalMin(value = "0.01", message = "Weekly target must be greater than 0")
    private BigDecimal weeklyTargetKg;
}

