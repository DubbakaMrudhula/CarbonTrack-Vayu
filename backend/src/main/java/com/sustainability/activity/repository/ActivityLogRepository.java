package com.sustainability.activity.repository;

import com.sustainability.activity.entity.ActivityLog;
import com.sustainability.emission.entity.ActivityCategory;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ActivityLogRepository extends JpaRepository<ActivityLog, Long> {

    Optional<ActivityLog> findByIdAndUserId(Long id, Long userId);

    @Query("SELECT a FROM ActivityLog a WHERE a.user.id = :userId " +
           "AND (:category IS NULL OR a.category = :category) " +
           "AND (cast(:fromDate as date) IS NULL OR a.logDate >= :fromDate) " +
           "AND (cast(:toDate as date) IS NULL OR a.logDate <= :toDate) " +
           "ORDER BY a.logDate DESC, a.id DESC")
    Page<ActivityLog> findFilteredActivities(
        @Param("userId") Long userId,
        @Param("category") ActivityCategory category,
        @Param("fromDate") LocalDate fromDate,
        @Param("toDate") LocalDate toDate,
        Pageable pageable
    );

    List<ActivityLog> findTop5ByUserIdOrderByLogDateDescIdDesc(Long userId);

    @Query("SELECT COALESCE(SUM(a.emissionKgCo2e), 0) FROM ActivityLog a WHERE a.user.id = :userId AND a.logDate = :date")
    BigDecimal sumEmissionsByUserIdAndDate(
        @Param("userId") Long userId,
        @Param("date") LocalDate date
    );

    long countByUserId(Long userId);

    @Query("SELECT a.category, COALESCE(SUM(a.emissionKgCo2e), 0) " +
           "FROM ActivityLog a WHERE a.user.id = :userId AND a.logDate = :date GROUP BY a.category")
    List<Object[]> sumEmissionsByCategoryAndDate(
        @Param("userId") Long userId,
        @Param("date") LocalDate date
    );
}
