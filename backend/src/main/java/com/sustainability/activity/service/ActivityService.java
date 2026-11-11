package com.sustainability.activity.service;

import com.sustainability.activity.dto.ActivityRequest;
import com.sustainability.activity.dto.ActivityResponse;
import com.sustainability.activity.dto.PatchActivityRequest;
import com.sustainability.activity.entity.ActivityLog;
import com.sustainability.activity.mapper.ActivityMapper;
import com.sustainability.activity.repository.ActivityLogRepository;
import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.emission.entity.EmissionFactor;
import com.sustainability.emission.service.EmissionCalculator;
import com.sustainability.emission.service.EmissionFactorService;
import com.sustainability.exception.ResourceNotFoundException;
import com.sustainability.user.entity.User;
import com.sustainability.user.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDate;

@Service
public class ActivityService {

    private final ActivityLogRepository activityLogRepository;
    private final EmissionFactorService emissionFactorService;
    private final EmissionCalculator emissionCalculator;
    private final UserRepository userRepository;
    private final ActivityMapper activityMapper;

    public ActivityService(
        ActivityLogRepository activityLogRepository,
        EmissionFactorService emissionFactorService,
        EmissionCalculator emissionCalculator,
        UserRepository userRepository,
        ActivityMapper activityMapper
    ) {
        this.activityLogRepository = activityLogRepository;
        this.emissionFactorService = emissionFactorService;
        this.emissionCalculator = emissionCalculator;
        this.userRepository = userRepository;
        this.activityMapper = activityMapper;
    }

    private User getAuthenticatedUser() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth == null || auth.getName() == null) {
            throw new BadCredentialsException("No authenticated user in security context");
        }
        String email = auth.getName().toLowerCase().trim();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found: " + email));
    }

    @Transactional
    public ActivityResponse createActivity(ActivityRequest request) {
        User user = getAuthenticatedUser();

        if (request.getLogDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Activity log date cannot be in the future");
        }

        EmissionFactor factor = emissionFactorService.getActiveFactor(
            request.getActivityType(),
            request.getUnit()
        );

        emissionCalculator.validate(
            request.getCategory(),
            request.getUnit(),
            request.getQuantity(),
            factor
        );

        BigDecimal emission = emissionCalculator.calculate(request.getQuantity(), factor.getFactorKgCo2e());

        ActivityLog log = ActivityLog.builder()
            .user(user)
            .category(request.getCategory())
            .activityType(factor.getActivityType())
            .emissionFactor(factor)
            .quantity(request.getQuantity())
            .unit(factor.getUnit())
            .factorUsed(factor.getFactorKgCo2e())
            .emissionKgCo2e(emission)
            .logDate(request.getLogDate())
            .notes(request.getNotes())
            .build();

        ActivityLog saved = activityLogRepository.save(log);
        return activityMapper.toResponse(saved);
    }

    @Transactional(readOnly = true)
    public Page<ActivityResponse> listActivities(
        ActivityCategory category,
        LocalDate from,
        LocalDate to,
        Pageable pageable
    ) {
        User user = getAuthenticatedUser();
        return activityLogRepository.findFilteredActivities(user.getId(), category, from, to, pageable)
            .map(activityMapper::toResponse);
    }

    @Transactional(readOnly = true)
    public ActivityResponse getActivityById(Long id) {
        User user = getAuthenticatedUser();
        ActivityLog log = activityLogRepository.findByIdAndUserId(id, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Activity not found with id: " + id));

        return activityMapper.toResponse(log);
    }

    @Transactional
    public ActivityResponse updateActivity(Long id, ActivityRequest request) {
        User user = getAuthenticatedUser();
        ActivityLog log = activityLogRepository.findByIdAndUserId(id, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Activity not found with id: " + id));

        if (request.getLogDate().isAfter(LocalDate.now())) {
            throw new IllegalArgumentException("Activity log date cannot be in the future");
        }

        EmissionFactor factor = emissionFactorService.getActiveFactor(
            request.getActivityType(),
            request.getUnit()
        );

        emissionCalculator.validate(
            request.getCategory(),
            request.getUnit(),
            request.getQuantity(),
            factor
        );

        BigDecimal emission = emissionCalculator.calculate(request.getQuantity(), factor.getFactorKgCo2e());

        log.setCategory(request.getCategory());
        log.setActivityType(factor.getActivityType());
        log.setEmissionFactor(factor);
        log.setQuantity(request.getQuantity());
        log.setUnit(factor.getUnit());
        log.setFactorUsed(factor.getFactorKgCo2e());
        log.setEmissionKgCo2e(emission);
        log.setLogDate(request.getLogDate());
        log.setNotes(request.getNotes());

        ActivityLog saved = activityLogRepository.save(log);
        return activityMapper.toResponse(saved);
    }

    @Transactional
    public ActivityResponse patchActivity(Long id, PatchActivityRequest request) {
        User user = getAuthenticatedUser();
        ActivityLog log = activityLogRepository.findByIdAndUserId(id, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Activity not found with id: " + id));

        if (request.getLogDate() != null) {
            if (request.getLogDate().isAfter(LocalDate.now())) {
                throw new IllegalArgumentException("Activity log date cannot be in the future");
            }
            log.setLogDate(request.getLogDate());
        }

        if (request.getNotes() != null) {
            log.setNotes(request.getNotes());
        }

        boolean calculationInputsChanged = (request.getQuantity() != null)
            || (request.getActivityType() != null)
            || (request.getUnit() != null)
            || (request.getCategory() != null);

        if (calculationInputsChanged) {
            ActivityCategory targetCategory = (request.getCategory() != null)
                ? request.getCategory()
                : log.getCategory();

            String targetType = (request.getActivityType() != null)
                ? request.getActivityType()
                : log.getActivityType();

            String targetUnit = (request.getUnit() != null)
                ? request.getUnit()
                : log.getUnit();

            BigDecimal targetQuantity = (request.getQuantity() != null)
                ? request.getQuantity()
                : log.getQuantity();

            EmissionFactor factor = emissionFactorService.getActiveFactor(targetType, targetUnit);

            emissionCalculator.validate(targetCategory, targetUnit, targetQuantity, factor);
            BigDecimal emission = emissionCalculator.calculate(targetQuantity, factor.getFactorKgCo2e());

            log.setCategory(targetCategory);
            log.setActivityType(factor.getActivityType());
            log.setEmissionFactor(factor);
            log.setQuantity(targetQuantity);
            log.setUnit(factor.getUnit());
            log.setFactorUsed(factor.getFactorKgCo2e());
            log.setEmissionKgCo2e(emission);
        }

        ActivityLog saved = activityLogRepository.save(log);
        return activityMapper.toResponse(saved);
    }

    @Transactional
    public void deleteActivity(Long id) {
        User user = getAuthenticatedUser();
        ActivityLog log = activityLogRepository.findByIdAndUserId(id, user.getId())
            .orElseThrow(() -> new ResourceNotFoundException("Activity not found with id: " + id));

        activityLogRepository.delete(log);
    }
}

