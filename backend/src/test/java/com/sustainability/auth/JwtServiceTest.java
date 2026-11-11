package com.sustainability.auth;

import com.sustainability.auth.security.JwtService;
import com.sustainability.config.AppProperties;
import io.jsonwebtoken.JwtException;
import io.jsonwebtoken.Jwts;
import io.jsonwebtoken.security.Keys;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;

import javax.crypto.SecretKey;
import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Collections;
import java.util.Date;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

public class JwtServiceTest {

    private JwtService jwtService;
    private AppProperties appProperties;
    private UserDetails userDetails;

    private static final String DEV_SECRET = "test_environment_secret_key_must_be_at_least_256_bits_long_for_vayu_test_suite_2026";

    @BeforeEach
    void setUp() {
        appProperties = new AppProperties();
        appProperties.getJwt().setSecret(DEV_SECRET);
        appProperties.getJwt().setExpirationMs(3600000L); // 1 hour

        jwtService = new JwtService(appProperties);

        userDetails = new User("asha@vayu.test", "password", Collections.emptyList());
    }

    @Test
    @DisplayName("Valid token generates correctly and validates against UserDetails")
    void validTokenValidationSucceeds() {
        String token = jwtService.generateToken("asha@vayu.test");

        assertThat(token).isNotBlank();
        assertThat(jwtService.extractEmail(token)).isEqualTo("asha@vayu.test");
        assertThat(jwtService.isTokenExpired(token)).isFalse();
        assertThat(jwtService.isTokenValid(token, userDetails)).isTrue();
    }

    @Test
    @DisplayName("Expired token is rejected by validation")
    void expiredTokenIsRejected() {
        SecretKey key = Keys.hmacShaKeyFor(DEV_SECRET.getBytes(StandardCharsets.UTF_8));
        Instant past = Instant.now().minusSeconds(3600);

        String expiredToken = Jwts.builder()
            .subject("asha@vayu.test")
            .issuedAt(Date.from(past.minusSeconds(3600)))
            .expiration(Date.from(past))
            .signWith(key, Jwts.SIG.HS256)
            .compact();

        assertThat(jwtService.isTokenExpired(expiredToken)).isTrue();
        assertThat(jwtService.isTokenValid(expiredToken, userDetails)).isFalse();
    }

    @Test
    @DisplayName("Tampered token payload fails signature verification")
    void tamperedTokenFailsVerification() {
        String token = jwtService.generateToken("asha@vayu.test");
        String[] parts = token.split("\\.");

        // Tamper with payload segment
        String tamperedToken = parts[0] + ".eyJzdWIiOiJoYWNrZXJAdmF5dS50ZXN0In0." + parts[2];

        assertThatThrownBy(() -> jwtService.extractEmail(tamperedToken))
            .isInstanceOf(JwtException.class);

        assertThat(jwtService.isTokenValid(tamperedToken, userDetails)).isFalse();
    }

    @Test
    @DisplayName("Token signed with different secret key is rejected as wrong signature")
    void tokenWithWrongSignatureIsRejected() {
        String foreignSecret = "completely_different_foreign_secret_key_that_is_at_least_256_bits_long_abcdef";
        SecretKey foreignKey = Keys.hmacShaKeyFor(foreignSecret.getBytes(StandardCharsets.UTF_8));

        String foreignToken = Jwts.builder()
            .subject("asha@vayu.test")
            .issuedAt(new Date())
            .expiration(new Date(System.currentTimeMillis() + 3600000))
            .signWith(foreignKey, Jwts.SIG.HS256)
            .compact();

        assertThatThrownBy(() -> jwtService.extractEmail(foreignToken))
            .isInstanceOf(JwtException.class);

        assertThat(jwtService.isTokenValid(foreignToken, userDetails)).isFalse();
    }
}

