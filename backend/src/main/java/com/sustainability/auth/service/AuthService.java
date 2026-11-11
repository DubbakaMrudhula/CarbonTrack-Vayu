package com.sustainability.auth.service;

import com.sustainability.auth.dto.AuthResponse;
import com.sustainability.auth.dto.LoginRequest;
import com.sustainability.auth.dto.RegisterRequest;
import com.sustainability.auth.dto.UserSummaryDto;
import com.sustainability.auth.security.JwtService;
import com.sustainability.exception.DuplicateEmailException;
import com.sustainability.user.entity.Role;
import com.sustainability.user.entity.User;
import com.sustainability.user.entity.UserPreference;
import com.sustainability.user.repository.UserPreferenceRepository;
import com.sustainability.user.repository.UserRepository;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;

@Service
public class AuthService {

    private final UserRepository userRepository;
    private final UserPreferenceRepository userPreferenceRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public AuthService(
        UserRepository userRepository,
        UserPreferenceRepository userPreferenceRepository,
        PasswordEncoder passwordEncoder,
        JwtService jwtService
    ) {
        this.userRepository = userRepository;
        this.userPreferenceRepository = userPreferenceRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmail(normalizedEmail)) {
            throw new DuplicateEmailException("Email is already registered: " + normalizedEmail);
        }

        User user = User.builder()
            .name(request.getName().trim())
            .email(normalizedEmail)
            .passwordHash(passwordEncoder.encode(request.getPassword()))
            .role(Role.USER)
            .enabled(true)
            .termsAcceptedAt(Instant.now())
            .build();

        User savedUser = userRepository.save(user);

        UserPreference preferences = UserPreference.builder()
            .user(savedUser)
            .country("India")
            .region(null)
            .currency("INR")
            .dietType("VEGETARIAN")
            .primaryTransport("METRO")
            .householdSize(1)
            .focusCategories("TRANSPORTATION,ELECTRICITY")
            .weeklyTargetKg(null)
            .build();

        userPreferenceRepository.save(preferences);
        savedUser.setPreference(preferences);

        String token = jwtService.generateToken(savedUser.getEmail());
        Instant expiresAt = jwtService.extractExpiration(token);

        UserSummaryDto userSummary = UserSummaryDto.builder()
            .id(savedUser.getId())
            .name(savedUser.getName())
            .email(savedUser.getEmail())
            .role(savedUser.getRole())
            .build();

        return AuthResponse.builder()
            .token(token)
            .expiresAt(expiresAt)
            .user(userSummary)
            .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest request) {
        String normalizedEmail = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmail(normalizedEmail)
            .orElseThrow(() -> new BadCredentialsException("Invalid email or password"));

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash()) || !user.isEnabled()) {
            throw new BadCredentialsException("Invalid email or password");
        }

        String token = jwtService.generateToken(user.getEmail());
        Instant expiresAt = jwtService.extractExpiration(token);

        UserSummaryDto userSummary = UserSummaryDto.builder()
            .id(user.getId())
            .name(user.getName())
            .email(user.getEmail())
            .role(user.getRole())
            .build();

        return AuthResponse.builder()
            .token(token)
            .expiresAt(expiresAt)
            .user(userSummary)
            .build();
    }
}

