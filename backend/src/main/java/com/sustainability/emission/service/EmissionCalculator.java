package com.sustainability.emission.service;

import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.emission.entity.EmissionFactor;
import com.sustainability.exception.InvalidQuantityException;
import com.sustainability.exception.UnitMismatchException;
import com.sustainability.exception.UnknownActivityTypeException;
import org.springframework.stereotype.Component;

import java.math.BigDecimal;
import java.math.RoundingMode;

/**
 * Pure stateless calculator for computing activity carbon emissions.
 * Performs validation of quantities, units, and categories.
 */
@Component
public class EmissionCalculator {

    public static final int SCALE = 4;
    public static final RoundingMode ROUNDING_MODE = RoundingMode.HALF_UP;

    public void validate(
        ActivityCategory category,
        String unit,
        BigDecimal quantity,
        EmissionFactor factor
    ) {
        if (factor == null) {
            throw new UnknownActivityTypeException("Emission factor cannot be null");
        }

        if (category != factor.getCategory()) {
            throw new UnknownActivityTypeException(
                "Activity category " + category + " does not match factor category " + factor.getCategory()
            );
        }

        if (unit == null || !unit.trim().equalsIgnoreCase(factor.getUnit().trim())) {
            throw new UnitMismatchException(
                "Provided unit '" + unit + "' does not match factor unit '" + factor.getUnit() + "'"
            );
        }

        if (quantity == null || quantity.compareTo(BigDecimal.ZERO) <= 0) {
            throw new InvalidQuantityException("Quantity must be strictly greater than 0");
        }

        if (factor.getMaxQuantity() != null && quantity.compareTo(factor.getMaxQuantity()) > 0) {
            throw new InvalidQuantityException(
                "Quantity " + quantity + " exceeds maximum allowed quantity of " + factor.getMaxQuantity()
            );
        }
    }

    public BigDecimal calculate(BigDecimal quantity, BigDecimal factorKgCo2e) {
        if (quantity == null || factorKgCo2e == null) {
            throw new InvalidQuantityException("Quantity and emission factor must not be null");
        }

        return quantity.multiply(factorKgCo2e).setScale(SCALE, ROUNDING_MODE);
    }
}

