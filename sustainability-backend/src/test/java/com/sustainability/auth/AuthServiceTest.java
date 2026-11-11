package com.sustainability.auth;

import com.sustainability.auth.dto.AuthResponse;
import com.sustainability.auth.dto.LoginRequest;
import com.sustainability.auth.dto.RegisterRequest;
import com.sustainability.auth.security.JwtService;
import com.sustainability.auth.service.AuthService;
import com.sustainability.exception.DuplicateEmailException;
import com.sustainability.user.entity.Role;
import com.sustainability.user.entity.User;
import com.sustainability.user.entity.UserPreference;
import com.sustainability.user.repository.UserPreferenceRepository;
import com.sustainability.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.Instant;
import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class AuthServiceTest {

    @Mock
    private UserRepository userRepository;

    @Mock
    private UserPreferenceRepository userPreferenceRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JwtService jwtService;

    @InjectMocks
    private AuthService authService;

    private RegisterRequest registerRequest;
    private LoginRequest loginRequest;

    @BeforeEach
    void setUp() {
        registerRequest = RegisterRequest.builder()
            .name("Asha Sharma")
            .email("asha@vayu.test")
            .password("SecurePass123")
            .acceptedTerms(true)
            .build();

        loginRequest = LoginRequest.builder()
            .email("asha@vayu.test")
            .password("SecurePass123")
            .build();
    }

    @Test
    @DisplayName("Register throws DuplicateEmailException when email already exists")
    void duplicateEmailThrowsDuplicateEmailException() {
        when(userRepository.existsByEmail("asha@vayu.test")).thenReturn(true);

        assertThatThrownBy(() -> authService.register(registerRequest))
            .isInstanceOf(DuplicateEmailException.class)
            .hasMessageContaining("asha@vayu.test");

        verify(userRepository, never()).save(any(User.class));
    }

    @Test
    @DisplayName("Register hashes the raw password and sets terms_accepted_at and default preferences")
    void passwordIsStoredHashedAndPreferencesCreated() {
        when(userRepository.existsByEmail("asha@vayu.test")).thenReturn(false);
        when(passwordEncoder.encode("SecurePass123")).thenReturn("$2a$10$hashedPasswordValue");

        User savedUser = User.builder()
            .id(1L)
            .name("Asha Sharma")
            .email("asha@vayu.test")
            .passwordHash("$2a$10$hashedPasswordValue")
            .role(Role.USER)
            .enabled(true)
            .termsAcceptedAt(Instant.now())
            .build();

        when(userRepository.save(any(User.class))).thenReturn(savedUser);
        when(jwtService.generateToken("asha@vayu.test")).thenReturn("mock.jwt.token");
        when(jwtService.extractExpiration("mock.jwt.token")).thenReturn(Instant.now().plusSeconds(3600));

        AuthResponse response = authService.register(registerRequest);

        assertThat(response).isNotNull();
        assertThat(response.getToken()).isEqualTo("mock.jwt.token");
        assertThat(response.getUser().getEmail()).isEqualTo("asha@vayu.test");

        ArgumentCaptor<User> userCaptor = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(userCaptor.capture());
        User capturedUser = userCaptor.getValue();
        assertThat(capturedUser.getPasswordHash()).isEqualTo("$2a$10$hashedPasswordValue");
        assertThat(capturedUser.getTermsAcceptedAt()).isNotNull();

        ArgumentCaptor<UserPreference> prefCaptor = ArgumentCaptor.forClass(UserPreference.class);
        verify(userPreferenceRepository).save(prefCaptor.capture());
        UserPreference capturedPref = prefCaptor.getValue();
        assertThat(capturedPref.getCountry()).isEqualTo("India");
        assertThat(capturedPref.getCurrency()).isEqualTo("INR");
    }

    @Test
    @DisplayName("Login with wrong password throws BadCredentialsException with exact message 'Invalid email or password'")
    void wrongPasswordThrowsBadCredentials() {
        User user = User.builder()
            .id(1L)
            .name("Asha Sharma")
            .email("asha@vayu.test")
            .passwordHash("$2a$10$hashedPasswordValue")
            .role(Role.USER)
            .enabled(true)
            .build();

        when(userRepository.findByEmail("asha@vayu.test")).thenReturn(Optional.of(user));
        when(passwordEncoder.matches("SecurePass123", "$2a$10$hashedPasswordValue")).thenReturn(false);

        assertThatThrownBy(() -> authService.login(loginRequest))
            .isInstanceOf(BadCredentialsException.class)
            .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("Login with unknown email throws BadCredentialsException with identical message 'Invalid email or password'")
    void unknownEmailThrowsBadCredentials() {
        when(userRepository.findByEmail("asha@vayu.test")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> authService.login(loginRequest))
            .isInstanceOf(BadCredentialsException.class)
            .hasMessage("Invalid email or password");
    }

    @Test
    @DisplayName("Login normalizes mixed-case whitespace email and rejects disabled user with identical message")
    void loginNormalizesEmailAndRejectsDisabledUser() {
        User disabledUser = User.builder()
            .id(2L)
            .name("Disabled User")
            .email("asha@vayu.test")
            .passwordHash("$2a$10$hashedPasswordValue")
            .role(Role.USER)
            .enabled(false)
            .build();

        LoginRequest mixedCaseRequest = LoginRequest.builder()
            .email("  ASHA@VAYU.TEST  ")
            .password("SecurePass123")
            .build();

        when(userRepository.findByEmail("asha@vayu.test")).thenReturn(Optional.of(disabledUser));
        when(passwordEncoder.matches("SecurePass123", "$2a$10$hashedPasswordValue")).thenReturn(true);

        assertThatThrownBy(() -> authService.login(mixedCaseRequest))
            .isInstanceOf(BadCredentialsException.class)
            .hasMessage("Invalid email or password");
    }
}

