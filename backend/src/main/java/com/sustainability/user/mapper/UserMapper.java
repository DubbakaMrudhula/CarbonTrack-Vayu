package com.sustainability.user.mapper;

import com.sustainability.user.dto.UserProfileResponse;
import com.sustainability.user.dto.UserPreferencesResponse;
import com.sustainability.user.entity.User;
import com.sustainability.user.entity.UserPreference;
import org.springframework.stereotype.Component;

@Component
public class UserMapper {

    public UserProfileResponse toProfileResponse(User user) {
        if (user == null) {
            return null;
        }

        return UserProfileResponse.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .role(user.getRole())
            .enabled(user.isEnabled())
            .termsAcceptedAt(user.getTermsAcceptedAt())
            .createdAt(user.getCreatedAt())
            .build();
    }

    public UserPreferencesResponse toPreferencesResponse(UserPreference preferences) {
        if (preferences == null) {
            return null;
        }

        return UserPreferencesResponse.builder()
            .id(preferences.getId())
            .country(preferences.getCountry())
            .region(preferences.getRegion())
            .currency(preferences.getCurrency())
            .dietType(preferences.getDietType())
            .primaryTransport(preferences.getPrimaryTransport())
            .householdSize(preferences.getHouseholdSize())
            .focusCategories(preferences.getFocusCategories())
            .weeklyTargetKg(preferences.getWeeklyTargetKg())
            .updatedAt(preferences.getUpdatedAt())
            .build();
    }
}

