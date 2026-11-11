package com.sustainability.user.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserPreferencesResponse {

    private Long id;
    private String country;
    private String region;
    private String currency;
    private String dietType;
    private String primaryTransport;
    private Integer householdSize;
    private String focusCategories;
    private BigDecimal weeklyTargetKg;
    private Instant updatedAt;
}

