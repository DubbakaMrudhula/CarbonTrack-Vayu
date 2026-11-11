package com.sustainability.user.dto;

import com.sustainability.user.entity.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.Instant;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class UserProfileResponse {

    private Long id;
    private String name;
    private String email;
    private Role role;
    private boolean enabled;
    private Instant termsAcceptedAt;
    private Instant createdAt;
}

