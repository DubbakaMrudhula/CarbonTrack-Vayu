package com.sustainability.emission.service;

import com.sustainability.emission.dto.EmissionFactorResponse;
import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.emission.entity.EmissionFactor;
import com.sustainability.emission.repository.EmissionFactorRepository;
import com.sustainability.exception.UnknownActivityTypeException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
public class EmissionFactorService {

    private final EmissionFactorRepository emissionFactorRepository;

    public EmissionFactorService(EmissionFactorRepository emissionFactorRepository) {
        this.emissionFactorRepository = emissionFactorRepository;
    }

    @Transactional(readOnly = true)
    public EmissionFactor getActiveFactor(String activityType, String unit) {
        String normalizedType = activityType == null ? "" : activityType.trim();
        String normalizedUnit = unit == null ? "" : unit.trim();
        return emissionFactorRepository.findByActivityTypeAndUnitAndActiveTrue(
            normalizedType,
            normalizedUnit
        ).orElseThrow(() -> new UnknownActivityTypeException(
            "No active emission factor found for activity type: " + activityType + " and unit: " + unit
        ));
    }

    @Transactional(readOnly = true)
    public List<EmissionFactorResponse> listActiveFactors(ActivityCategory category) {
        List<EmissionFactor> factors = (category != null)
            ? emissionFactorRepository.findByCategoryAndActiveTrue(category)
            : emissionFactorRepository.findByActiveTrue();

        return factors.stream()
            .map(this::toResponse)
            .toList();
    }

    private EmissionFactorResponse toResponse(EmissionFactor factor) {
        return EmissionFactorResponse.builder()
            .activityType(factor.getActivityType())
            .displayName(factor.getDisplayName())
            .category(factor.getCategory())
            .unit(factor.getUnit())
            .maxQuantity(factor.getMaxQuantity())
            .build();
    }
}

