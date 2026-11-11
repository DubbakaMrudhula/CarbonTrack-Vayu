package com.sustainability.activity.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryResponse {

    private LocalDate date;
    private BigDecimal totalEmissionKgCo2e;
    private long totalActivityCount;
    private List<ActivityResponse> recentActivities;
    private List<CategoryTotalDto> categoryTotals;
}

