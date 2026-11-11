package com.sustainability.user.controller;

import com.sustainability.user.dto.ChangePasswordRequest;
import com.sustainability.user.dto.DeleteAccountRequest;
import com.sustainability.user.dto.UpdateUserRequest;
import com.sustainability.user.dto.UserProfileResponse;
import com.sustainability.user.dto.UserPreferencesRequest;
import com.sustainability.user.dto.UserPreferencesResponse;
import com.sustainability.user.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/users/me")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @GetMapping
    public ResponseEntity<UserProfileResponse> getProfile() {
        UserProfileResponse response = userService.getProfile();
        return ResponseEntity.ok(response);
    }

    @PutMapping
    public ResponseEntity<UserProfileResponse> updateProfile(@Valid @RequestBody UpdateUserRequest request) {
        UserProfileResponse response = userService.updateProfile(request);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/preferences")
    public ResponseEntity<UserPreferencesResponse> getPreferences() {
        UserPreferencesResponse response = userService.getPreferences();
        return ResponseEntity.ok(response);
    }

    @PutMapping("/preferences")
    public ResponseEntity<UserPreferencesResponse> updatePreferences(@Valid @RequestBody UserPreferencesRequest request) {
        UserPreferencesResponse response = userService.updatePreferences(request);
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/password")
    public ResponseEntity<Void> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        userService.changePassword(request);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteAccount(@Valid @RequestBody DeleteAccountRequest request) {
        userService.deleteAccount(request);
        return ResponseEntity.noContent().build();
    }
}

