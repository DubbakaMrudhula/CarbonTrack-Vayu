package com.sustainability.emission;

import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.emission.entity.EmissionFactor;
import com.sustainability.emission.service.EmissionCalculator;
import com.sustainability.exception.InvalidQuantityException;
import com.sustainability.exception.UnitMismatchException;
import com.sustainability.exception.UnknownActivityTypeException;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import java.math.BigDecimal;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

public class EmissionCalculatorTest {

    private EmissionCalculator calculator;

    // Test-only static fixture data (clearly labeled for unit testing)
    private static final BigDecimal TEST_MAX_QUANTITY = new BigDecimal("1000.0000");

    @BeforeEach
    void setUp() {
        calculator = new EmissionCalculator();
    }

    private EmissionFactor buildFixtureFactor(ActivityCategory category, String unit, BigDecimal factorValue) {
        return EmissionFactor.builder()
            .category(category)
            .activityType("TEST_ACTIVITY")
            .displayName("Test Activity")
            .unit(unit)
            .factorKgCo2e(factorValue)
            .maxQuantity(TEST_MAX_QUANTITY)
            .verified(true)
            .active(true)
            .build();
    }

    @ParameterizedTest
    @CsvSource({
        "TRANSPORTATION, km, 0.170480, 50.0000, 8.5240",
        "ELECTRICITY, kWh, 0.716000, 100.0000, 71.6000",
        "FOOD, serving, 1.500000, 2.0000, 3.0000",
        "SHOPPING, INR, 0.000500, 500.0000, 0.2500"
    })
    @DisplayName("Calculate emissions across all four categories produces expected scaled values")
    void calculateAcrossCategories(
        ActivityCategory category,
        String unit,
        String factorStr,
        String quantityStr,
        String expectedEmissionStr
    ) {
        BigDecimal factor = new BigDecimal(factorStr);
        BigDecimal quantity = new BigDecimal(quantityStr);
        BigDecimal expected = new BigDecimal(expectedEmissionStr);

        EmissionFactor fixture = buildFixtureFactor(category, unit, factor);
        calculator.validate(category, unit, quantity, fixture);

        BigDecimal result = calculator.calculate(quantity, factor);
        assertThat(result).isEqualByComparingTo(expected);
        assertThat(result.scale()).isEqualTo(4);
    }

    @Test
    @DisplayName("Boundary: minimum positive fraction 0.0001 is accepted and calculated")
    void boundaryMinPositiveFractionAccepted() {
        EmissionFactor factor = buildFixtureFactor(ActivityCategory.TRANSPORTATION, "km", new BigDecimal("0.170480"));
        BigDecimal quantity = new BigDecimal("0.0001");

        calculator.validate(ActivityCategory.TRANSPORTATION, "km", quantity, factor);
        BigDecimal result = calculator.calculate(quantity, factor.getFactorKgCo2e());

        // 0.0001 * 0.170480 = 0.000017048 -> scales HALF_UP to 0.0000
        assertThat(result).isEqualByComparingTo(new BigDecimal("0.0000"));
    }

    @Test
    @DisplayName("Boundary: exactly max_quantity is accepted")
    void boundaryExactlyMaxQuantityAccepted() {
        EmissionFactor factor = buildFixtureFactor(ActivityCategory.ELECTRICITY, "kWh", new BigDecimal("0.716000"));
        BigDecimal quantity = TEST_MAX_QUANTITY;

        calculator.validate(ActivityCategory.ELECTRICITY, "kWh", quantity, factor);
        BigDecimal result = calculator.calculate(quantity, factor.getFactorKgCo2e());

        // 1000 * 0.716000 = 716.0000
        assertThat(result).isEqualByComparingTo(new BigDecimal("716.0000"));
    }

    @Test
    @DisplayName("Boundary: zero quantity throws InvalidQuantityException")
    void boundaryZeroQuantityThrowsException() {
        EmissionFactor factor = buildFixtureFactor(ActivityCategory.TRANSPORTATION, "km", new BigDecimal("0.170480"));

        assertThatThrownBy(() -> calculator.validate(ActivityCategory.TRANSPORTATION, "km", BigDecimal.ZERO, factor))
            .isInstanceOf(InvalidQuantityException.class)
            .hasMessageContaining("greater than 0");
    }

    @Test
    @DisplayName("Boundary: negative quantity throws InvalidQuantityException")
    void boundaryNegativeQuantityThrowsException() {
        EmissionFactor factor = buildFixtureFactor(ActivityCategory.TRANSPORTATION, "km", new BigDecimal("0.170480"));
        BigDecimal negativeQty = new BigDecimal("-5.0000");

        assertThatThrownBy(() -> calculator.validate(ActivityCategory.TRANSPORTATION, "km", negativeQty, factor))
            .isInstanceOf(InvalidQuantityException.class)
            .hasMessageContaining("greater than 0");
    }

    @Test
    @DisplayName("Boundary: above max_quantity throws InvalidQuantityException")
    void boundaryAboveMaxQuantityThrowsException() {
        EmissionFactor factor = buildFixtureFactor(ActivityCategory.TRANSPORTATION, "km", new BigDecimal("0.170480"));
        BigDecimal aboveMax = TEST_MAX_QUANTITY.add(new BigDecimal("0.0001"));

        assertThatThrownBy(() -> calculator.validate(ActivityCategory.TRANSPORTATION, "km", aboveMax, factor))
            .isInstanceOf(InvalidQuantityException.class)
            .hasMessageContaining("exceeds maximum allowed quantity");
    }

    @Test
    @DisplayName("Rounding check: verifies HALF_UP rounding to exactly 4 decimal places")
    void roundingModeHalfUpVerification() {
        // 1.0000 * 0.12345 = 0.12345 -> rounds up to 0.1235
        BigDecimal result1 = calculator.calculate(new BigDecimal("1.0000"), new BigDecimal("0.123450"));
        assertThat(result1).isEqualTo(new BigDecimal("0.1235"));

        // 1.0000 * 0.12344 = 0.12344 -> rounds down to 0.1234
        BigDecimal result2 = calculator.calculate(new BigDecimal("1.0000"), new BigDecimal("0.123440"));
        assertThat(result2).isEqualTo(new BigDecimal("0.1234"));
    }

    @Test
    @DisplayName("Unit mismatch throws UnitMismatchException")
    void unitMismatchThrowsException() {
        EmissionFactor factor = buildFixtureFactor(ActivityCategory.TRANSPORTATION, "km", new BigDecimal("0.170480"));

        assertThatThrownBy(() -> calculator.validate(ActivityCategory.TRANSPORTATION, "miles", new BigDecimal("10.0000"), factor))
            .isInstanceOf(UnitMismatchException.class)
            .hasMessageContaining("does not match factor unit");
    }

    @Test
    @DisplayName("Category mismatch throws UnknownActivityTypeException")
    void categoryMismatchThrowsException() {
        EmissionFactor factor = buildFixtureFactor(ActivityCategory.TRANSPORTATION, "km", new BigDecimal("0.170480"));

        assertThatThrownBy(() -> calculator.validate(ActivityCategory.FOOD, "km", new BigDecimal("10.0000"), factor))
            .isInstanceOf(UnknownActivityTypeException.class)
            .hasMessageContaining("does not match factor category");
    }

    @Test
    @DisplayName("Null factor or null calculation arguments throw domain exceptions")
    void nullInputsThrowExpectedExceptions() {
        assertThatThrownBy(() -> calculator.validate(ActivityCategory.ELECTRICITY, "kWh", BigDecimal.ONE, null))
            .isInstanceOf(UnknownActivityTypeException.class)
            .hasMessageContaining("cannot be null");

        EmissionFactor factor = buildFixtureFactor(ActivityCategory.ELECTRICITY, "kWh", new BigDecimal("0.716000"));
        assertThatThrownBy(() -> calculator.validate(ActivityCategory.ELECTRICITY, null, BigDecimal.ONE, factor))
            .isInstanceOf(UnitMismatchException.class);

        assertThatThrownBy(() -> calculator.validate(ActivityCategory.ELECTRICITY, "kWh", null, factor))
            .isInstanceOf(InvalidQuantityException.class);

        assertThatThrownBy(() -> calculator.calculate(null, new BigDecimal("0.716000")))
            .isInstanceOf(InvalidQuantityException.class);

        assertThatThrownBy(() -> calculator.calculate(BigDecimal.ONE, null))
            .isInstanceOf(InvalidQuantityException.class);
    }

    @Test
    @DisplayName("Fractional precision inputs calculate accurately with HALF_UP scale 4")
    void fractionalPrecisionCalculation() {
        // 0.3333 * 0.716000 = 0.2386428 -> 0.2386
        BigDecimal elec = calculator.calculate(new BigDecimal("0.3333"), new BigDecimal("0.716000"));
        assertThat(elec).isEqualTo(new BigDecimal("0.2386"));

        // 2500.5000 * 0.000125 = 0.3125625 -> 0.3126
        BigDecimal shop = calculator.calculate(new BigDecimal("2500.5000"), new BigDecimal("0.000125"));
        assertThat(shop).isEqualTo(new BigDecimal("0.3126"));
    }
}

