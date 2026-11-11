package com.sustainability.emission.entity;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.EntityListeners;
import jakarta.persistence.EnumType;
import jakarta.persistence.Enumerated;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import org.springframework.data.annotation.CreatedDate;
import org.springframework.data.annotation.LastModifiedDate;
import org.springframework.data.jpa.domain.support.AuditingEntityListener;

import java.math.BigDecimal;
import java.time.Instant;

@Entity
@Table(
    name = "emission_factors",
    uniqueConstraints = {
        @UniqueConstraint(name = "uq_emission_factors_type_unit", columnNames = {"activity_type", "unit"})
    }
)
@EntityListeners(AuditingEntityListener.class)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EmissionFactor {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 50)
    private ActivityCategory category;

    @Column(name = "activity_type", nullable = false, length = 100)
    private String activityType;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @Column(nullable = false, length = 50)
    private String unit;

    @Column(name = "factor_kg_co2e", nullable = false, precision = 14, scale = 6)
    private BigDecimal factorKgCo2e;

    @Column(name = "max_quantity", nullable = false, precision = 12, scale = 4)
    private BigDecimal maxQuantity;

    @Column(name = "source_name", nullable = false)
    private String sourceName;

    @Column(name = "source_year", nullable = false, length = 50)
    private String sourceYear;

    @Column(name = "source_url", nullable = false, columnDefinition = "TEXT")
    private String sourceUrl;

    @Column(nullable = false)
    @Builder.Default
    private boolean verified = false;

    @Column(nullable = false)
    @Builder.Default
    private boolean active = false;

    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @LastModifiedDate
    @Column(name = "updated_at", nullable = false)
    private Instant updatedAt;
}

