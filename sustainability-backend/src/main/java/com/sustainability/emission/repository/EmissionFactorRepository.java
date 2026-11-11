package com.sustainability.emission.repository;

import com.sustainability.emission.entity.ActivityCategory;
import com.sustainability.emission.entity.EmissionFactor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface EmissionFactorRepository extends JpaRepository<EmissionFactor, Long> {

    Optional<EmissionFactor> findByActivityTypeAndUnitAndActiveTrue(String activityType, String unit);

    List<EmissionFactor> findByCategoryAndActiveTrue(ActivityCategory category);

    List<EmissionFactor> findByActiveTrue();
}

