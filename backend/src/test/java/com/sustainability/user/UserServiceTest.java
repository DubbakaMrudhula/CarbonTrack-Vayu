package com.sustainability.user;

import com.sustainability.user.dto.ChangePasswordRequest;
import com.sustainability.user.dto.DeleteAccountRequest;
import com.sustainability.user.dto.UpdateUserRequest;
import com.sustainability.user.dto.UserProfileResponse;
import com.sustainability.user.dto.UserPreferencesRequest;
import com.sustainability.user.dto.UserPreferencesResponse;
import com.sustainability.user.entity.Role;
import com.sustainability.user.entity.User;
import com.sustainability.user.entity.UserPreference;
import com.sustainability.user.mapper.UserMapper;
import com.sustainability.user.repository.UserPreferenceRepository;
import com.sustainability.user.repository.UserRepository;
import com.sustainability.user.service.UserService;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.Collections;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class UserServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserPreferenceRepository userPreferenceRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Spy
    private UserMapper userMapper;

    @InjectMocks
    private UserService userService;

    private User testUser;
    private UserPreference testPreference;

    @BeforeEach
    void setUp() {
        testUser = User.builder()
            .id(1L)
            .name("Asha Sharma")
            .email("asha@vayu.test")
            .passwordHash("$2a$10$oldHashedPassword")
            .role(Role.USER)
            .enabled(true)
            .termsAcceptedAt(Instant.now())
            .createdAt(Instant.now())
            .updatedAt(Instant.now())
            .build();

        testPreference = UserPreference.builder()
            .id(1L)
            .user(testUser)
            .country("India")
            .region("Karnataka")
            .currency("INR")
            .dietType("VEGETARIAN")
            .primaryTransport("METRO")
            .householdSize(2)
            .focusCategories("TRANSPORTATION,ELECTRICITY")
            .weeklyTargetKg(new BigDecimal("25.00"))
            .updatedAt(Instant.now())
            .build();

        UsernamePasswordAuthenticationToken auth =
            new UsernamePasswordAuthenticationToken("asha@vayu.test", null, Collections.emptyList());
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    @DisplayName("Change password throws BadCredentialsException when current password does not match")
    void changePasswordFailsOnWrongCurrentPassword() {
        when(userRepository.findByEmail("asha@vayu.test")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("WrongPass123", "$2a$10$oldHashedPassword")).thenReturn(false);

        ChangePasswordRequest request = ChangePasswordRequest.builder()
            .currentPassword("WrongPass123")
            .newPassword("NewSecurePass456")
            .build();

        assertThatThrownBy(() -> userService.changePassword(request))
            .isInstanceOf(BadCredentialsException.class)
            .hasMessage("Current password does not match");
    }

    @Test
    @DisplayName("Change password updates passwordHash when current password is valid")
    void changePasswordSucceeds() {
        when(userRepository.findByEmail("asha@vayu.test")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("OldPass123", "$2a$10$oldHashedPassword")).thenReturn(true);
        when(passwordEncoder.encode("NewSecurePass456")).thenReturn("$2a$10$newHashedPassword");

        ChangePasswordRequest request = ChangePasswordRequest.builder()
            .currentPassword("OldPass123")
            .newPassword("NewSecurePass456")
            .build();

        userService.changePassword(request);

        assertThat(testUser.getPasswordHash()).isEqualTo("$2a$10$newHashedPassword");
        verify(userRepository).save(testUser);
    }

    @Test
    @DisplayName("Update preferences saves and returns updated preference response")
    void updatePreferencesSucceeds() {
        when(userRepository.findByEmail("asha@vayu.test")).thenReturn(Optional.of(testUser));
        when(userPreferenceRepository.findByUserId(1L)).thenReturn(Optional.of(testPreference));
        when(userPreferenceRepository.save(any(UserPreference.class))).thenReturn(testPreference);

        UserPreferencesRequest request = UserPreferencesRequest.builder()
            .country("India")
            .region("Delhi")
            .currency("INR")
            .dietType("VEGAN")
            .primaryTransport("BUS_CITY")
            .householdSize(3)
            .focusCategories("FOOD,TRANSPORTATION")
            .weeklyTargetKg(new BigDecimal("30.00"))
            .build();

        UserPreferencesResponse response = userService.updatePreferences(request);

        assertThat(response).isNotNull();
        assertThat(testPreference.getDietType()).isEqualTo("VEGAN");
        assertThat(testPreference.getHouseholdSize()).isEqualTo(3);
        verify(userPreferenceRepository).save(testPreference);
    }

    @Test
    @DisplayName("Delete account throws BadCredentialsException when password is incorrect")
    void deleteAccountFailsOnWrongPassword() {
        when(userRepository.findByEmail("asha@vayu.test")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("WrongPass123", "$2a$10$oldHashedPassword")).thenReturn(false);

        DeleteAccountRequest request = DeleteAccountRequest.builder()
            .password("WrongPass123")
            .build();

        assertThatThrownBy(() -> userService.deleteAccount(request))
            .isInstanceOf(BadCredentialsException.class)
            .hasMessage("Incorrect password");
    }

    @Test
    @DisplayName("Delete account calls userRepository.delete to trigger cascade deletion")
    void deleteAccountRemovesUser() {
        when(userRepository.findByEmail("asha@vayu.test")).thenReturn(Optional.of(testUser));
        when(passwordEncoder.matches("CorrectPass123", "$2a$10$oldHashedPassword")).thenReturn(true);

        DeleteAccountRequest request = DeleteAccountRequest.builder()
            .password("CorrectPass123")
            .build();

        userService.deleteAccount(request);

        verify(userRepository).delete(testUser);
    }
}

