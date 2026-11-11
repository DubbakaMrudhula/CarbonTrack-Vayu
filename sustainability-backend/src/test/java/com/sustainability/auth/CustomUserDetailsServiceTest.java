package com.sustainability.auth;

import com.sustainability.auth.security.CustomUserDetailsService;
import com.sustainability.user.entity.Role;
import com.sustainability.user.entity.User;
import com.sustainability.user.repository.UserRepository;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UsernameNotFoundException;

import java.util.Optional;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
public class CustomUserDetailsServiceTest {

    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private CustomUserDetailsService customUserDetailsService;

    @Test
    @DisplayName("Normalizes email to lowercase and trimmed before repository lookup")
    void loadUserNormalizesEmailAndReturnsAuthorities() {
        User user = User.builder()
            .id(1L)
            .name("Asha Sharma")
            .email("asha@vayu.test")
            .passwordHash("$2a$10$hashed")
            .role(Role.USER)
            .enabled(true)
            .build();

        when(userRepository.findByEmail("asha@vayu.test")).thenReturn(Optional.of(user));

        UserDetails details = customUserDetailsService.loadUserByUsername("  ASHA@VAYU.TEST  ");

        assertThat(details.getUsername()).isEqualTo("asha@vayu.test");
        assertThat(details.isEnabled()).isTrue();
        assertThat(details.getAuthorities())
            .extracting("authority")
            .containsExactly("ROLE_USER");
    }

    @Test
    @DisplayName("Throws UsernameNotFoundException when user does not exist")
    void loadMissingUserThrowsUsernameNotFoundException() {
        when(userRepository.findByEmail("missing@vayu.test")).thenReturn(Optional.empty());

        assertThatThrownBy(() -> customUserDetailsService.loadUserByUsername("missing@vayu.test"))
            .isInstanceOf(UsernameNotFoundException.class);
    }
}

