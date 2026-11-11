package com.sustainability.activity.dto;

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
public class CategoryTotalDto {

    private ActivityCategory category;
    private BigDecimal totalEmissionKgCo2e;
}

