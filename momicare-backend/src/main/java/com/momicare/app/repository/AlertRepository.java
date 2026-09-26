package com.momicare.app.repository;

import com.momicare.app.entity.Alert;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.time.Instant;
import java.util.List;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    /** All alerts sorted by priority severity (Critical first) */
    @Query("SELECT a FROM Alert a ORDER BY CASE a.priority " +
           "WHEN com.momicare.app.entity.Alert$Priority.Critical THEN 0 " +
           "WHEN com.momicare.app.entity.Alert$Priority.High THEN 1 " +
           "WHEN com.momicare.app.entity.Alert$Priority.Moderate THEN 2 " +
           "ELSE 3 END ASC, a.createdAt DESC")
    List<Alert> findAllOrderedByPriority();

    /** Alerts for patients assigned to a specific doctor */
    @Query("SELECT a FROM Alert a WHERE a.patient.id IN " +
           "(SELECT p.id FROM Patient p JOIN p.assignedDoctors d WHERE d.id = :doctorId) " +
           "ORDER BY CASE a.priority " +
           "WHEN com.momicare.app.entity.Alert$Priority.Critical THEN 0 " +
           "WHEN com.momicare.app.entity.Alert$Priority.High THEN 1 " +
           "WHEN com.momicare.app.entity.Alert$Priority.Moderate THEN 2 " +
           "ELSE 3 END ASC, a.createdAt DESC")
    List<Alert> findByDoctorOrderedByPriority(@Param("doctorId") Long doctorId);

    List<Alert> findByPatientIdOrderByCreatedAtDesc(Long patientId);

    /** Critical alerts that are still in Alert status past the escalation window */
    @Query("SELECT a FROM Alert a WHERE a.priority = com.momicare.app.entity.Alert$Priority.Critical " +
           "AND a.status = com.momicare.app.entity.Alert$AlertStatus.Alert " +
           "AND a.createdAt < :cutoff")
    List<Alert> findUnreviewedCriticalBefore(@Param("cutoff") Instant cutoff);
}
