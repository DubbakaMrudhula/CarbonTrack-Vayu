package com.sustainability.emission;

import com.sustainability.emission.dto.EmissionFactorResponse;
import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.emission.entity.EmissionFactor;
import com.sustainability.emission.repository.EmissionFactorRepository;
import com.sustainability.emission.service.EmissionFactorService;
import com.sustainability.exception.UnknownActivityTypeException;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class EmissionFactorServiceTest {

    @Mock
    private EmissionFactorRepository emissionFactorRepository;

    @InjectMocks
    private EmissionFactorService emissionFactorService;

    @Test
    @DisplayName("Returns active emission factor when activity type and unit match an active factor")
    void getActiveFactorSucceeds() {
        EmissionFactor activeFactor = EmissionFactor.builder()
            .id(1L)
            .category(ActivityCategory.ELECTRICITY)
            .activityType("ELECTRICITY_GRID")
            .displayName("Grid Electricity")
            .unit("kWh")
            .factorKgCo2e(new BigDecimal("0.716000"))
            .active(true)
            .verified(true)
            .build();

        when(emissionFactorRepository.findByActivityTypeAndUnitAndActiveTrue("ELECTRICITY_GRID", "kWh"))
            .thenReturn(Optional.of(activeFactor));

        EmissionFactor result = emissionFactorService.getActiveFactor("ELECTRICITY_GRID", "kWh");
        assertThat(result).isNotNull();
        assertThat(result.getActivityType()).isEqualTo("ELECTRICITY_GRID");
    }

    @Test
    @DisplayName("Throws UnknownActivityTypeException when activity type is unknown")
    void unknownActivityTypeThrowsException() {
        when(emissionFactorRepository.findByActivityTypeAndUnitAndActiveTrue("SPACESHIP_WARP", "km"))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> emissionFactorService.getActiveFactor("SPACESHIP_WARP", "km"))
            .isInstanceOf(UnknownActivityTypeException.class)
            .hasMessageContaining("SPACESHIP_WARP");
    }

    @Test
    @DisplayName("Throws UnknownActivityTypeException when factor exists but is inactive")
    void inactiveFactorThrowsException() {
        // Repository method findByActivityTypeAndUnitAndActiveTrue filters active=true, so inactive returns empty
        when(emissionFactorRepository.findByActivityTypeAndUnitAndActiveTrue("CAR_CNG", "km"))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> emissionFactorService.getActiveFactor("CAR_CNG", "km"))
            .isInstanceOf(UnknownActivityTypeException.class)
            .hasMessageContaining("CAR_CNG");
    }

    @Test
    @DisplayName("Throws UnknownActivityTypeException when unit does not match the active factor's unit")
    void wrongUnitThrowsException() {
        when(emissionFactorRepository.findByActivityTypeAndUnitAndActiveTrue("ELECTRICITY_GRID", "liters"))
            .thenReturn(Optional.empty());

        assertThatThrownBy(() -> emissionFactorService.getActiveFactor("ELECTRICITY_GRID", "liters"))
            .isInstanceOf(UnknownActivityTypeException.class)
            .hasMessageContaining("liters");
    }

    @Test
    @DisplayName("listActiveFactors filters by category when provided and lists all active when null")
    void listActiveFactorsFiltersAndMapsCorrectly() {
        EmissionFactor car = EmissionFactor.builder()
            .id(1L)
            .category(ActivityCategory.TRANSPORTATION)
            .activityType("CAR_PETROL")
            .displayName("Petrol Car (Medium)")
            .unit("km")
            .maxQuantity(new BigDecimal("5000.0000"))
            .factorKgCo2e(new BigDecimal("0.170480"))
            .active(true)
            .verified(true)
            .build();

        EmissionFactor grid = EmissionFactor.builder()
            .id(2L)
            .category(ActivityCategory.ELECTRICITY)
            .activityType("ELECTRICITY_GRID")
            .displayName("Grid Electricity")
            .unit("kWh")
            .maxQuantity(new BigDecimal("10000.0000"))
            .factorKgCo2e(new BigDecimal("0.716000"))
            .active(true)
            .verified(true)
            .build();

        when(emissionFactorRepository.findByCategoryAndActiveTrue(ActivityCategory.TRANSPORTATION))
            .thenReturn(List.of(car));
        when(emissionFactorRepository.findByActiveTrue())
            .thenReturn(List.of(car, grid));

        List<EmissionFactorResponse> transportOnly = emissionFactorService.listActiveFactors(ActivityCategory.TRANSPORTATION);
        assertThat(transportOnly).hasSize(1);
        assertThat(transportOnly.get(0).getActivityType()).isEqualTo("CAR_PETROL");

        List<EmissionFactorResponse> allActive = emissionFactorService.listActiveFactors(null);
        assertThat(allActive).hasSize(2);
    }
}

