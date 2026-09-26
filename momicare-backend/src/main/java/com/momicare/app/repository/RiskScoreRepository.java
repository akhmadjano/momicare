package com.momicare.app.repository;

import com.momicare.app.entity.RiskScore;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface RiskScoreRepository extends JpaRepository<RiskScore, Long> {

    List<RiskScore> findByPatientIdOrderByCalculatedAtAsc(Long patientId);

    List<RiskScore> findByPatientIdOrderByCalculatedAtDesc(Long patientId);

    /** Latest risk score for a patient */
    @Query("SELECT r FROM RiskScore r WHERE r.patient.id = :patientId ORDER BY r.calculatedAt DESC LIMIT 1")
    Optional<RiskScore> findLatestByPatientId(@Param("patientId") Long patientId);

    /** Latest risk level per district for regional summary */
    @Query(value = """
        SELECT DISTINCT ON (p.district) p.district, rs.risk_level
        FROM risk_scores rs
        JOIN patients p ON p.id = rs.patient_id
        WHERE p.district IS NOT NULL
        ORDER BY p.district, rs.calculated_at DESC
        """, nativeQuery = true)
    List<Object[]> findLatestRiskLevelByDistrict();
}
