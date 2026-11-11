package com.sustainability.user.service;

import com.sustainability.exception.ResourceNotFoundException;
import com.sustainability.user.dto.ChangePasswordRequest;
import com.sustainability.user.dto.DeleteAccountRequest;
import com.sustainability.user.dto.UpdateUserRequest;
import com.sustainability.user.dto.UserProfileResponse;
import com.sustainability.user.dto.UserPreferencesRequest;
import com.sustainability.user.dto.UserPreferencesResponse;
import com.sustainability.user.entity.User;
import com.sustainability.user.entity.UserPreference;
import com.sustainability.user.mapper.UserMapper;
import com.sustainability.user.repository.UserPreferenceRepository;
import com.sustainability.user.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final PasswordEncoder passwordEncoder;
    private final UserMapper userMapper;

    public UserService(
        UserRepository userRepository,
        UserPreferenceRepository userPreferenceRepository,
        PasswordEncoder passwordEncoder,
        UserMapper userMapper
    ) {
        this.userRepository = userRepository;
        this.userPreferenceRepository = userPreferenceRepository;
        this.passwordEncoder = passwordEncoder;
        this.userMapper = userMapper;
    }

    private User getAuthenticatedUser() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication == null || authentication.getName() == null) {
            throw new BadCredentialsException("No authenticated user in security context");
        }

        String email = authentication.getName().toLowerCase().trim();
        return userRepository.findByEmail(email)
            .orElseThrow(() -> new ResourceNotFoundException("Authenticated user not found: " + email));
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getProfile() {
        User user = getAuthenticatedUser();
        return userMapper.toProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(UpdateUserRequest request) {
        User user = getAuthenticatedUser();
        user.setName(request.getName().trim());
        User savedUser = userRepository.save(user);
        return userMapper.toProfileResponse(savedUser);
    }

    @Transactional
    public UserPreferencesResponse getPreferences() {
        User user = getAuthenticatedUser();
        UserPreference preferences = userPreferenceRepository.findByUserId(user.getId())
            .orElseGet(() -> userPreferenceRepository.save(
                UserPreference.builder()
                    .user(user)
                    .country("India")
                    .region(null)
                    .currency("INR")
                    .dietType("VEGETARIAN")
                    .primaryTransport("METRO")
                    .householdSize(1)
                    .focusCategories("TRANSPORTATION,ELECTRICITY")
                    .weeklyTargetKg(null)
                    .build()
            ));

        return userMapper.toPreferencesResponse(preferences);
    }

    @Transactional
    public UserPreferencesResponse updatePreferences(UserPreferencesRequest request) {
        User user = getAuthenticatedUser();
        UserPreference preferences = userPreferenceRepository.findByUserId(user.getId())
            .orElseGet(() -> UserPreference.builder().user(user).build());

        preferences.setCountry(request.getCountry().trim());
        preferences.setRegion(request.getRegion() != null ? request.getRegion().trim() : null);
        preferences.setCurrency(request.getCurrency().trim().toUpperCase());
        preferences.setDietType(request.getDietType().trim());
        preferences.setPrimaryTransport(request.getPrimaryTransport().trim());
        preferences.setHouseholdSize(request.getHouseholdSize());
        preferences.setFocusCategories(request.getFocusCategories().trim());
        preferences.setWeeklyTargetKg(request.getWeeklyTargetKg());

        UserPreference savedPreferences = userPreferenceRepository.save(preferences);
        return userMapper.toPreferencesResponse(savedPreferences);
    }

    @Transactional
    public void changePassword(ChangePasswordRequest request) {
        User user = getAuthenticatedUser();

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Current password does not match");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }

    @Transactional
    public void deleteAccount(DeleteAccountRequest request) {
        User user = getAuthenticatedUser();

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            throw new BadCredentialsException("Incorrect password");
        }

        userRepository.delete(user);
    }
}

