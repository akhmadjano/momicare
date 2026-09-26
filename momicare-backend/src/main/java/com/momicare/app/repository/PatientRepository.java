package com.momicare.app.repository;

import com.momicare.app.entity.Patient;
import com.momicare.app.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface PatientRepository extends JpaRepository<Patient, Long> {

    Optional<Patient> findByUser(User user);

    Optional<Patient> findByUserId(Long userId);

    /** All patients assigned to a specific doctor */
    @Query("SELECT p FROM Patient p JOIN p.assignedDoctors d WHERE d.id = :doctorId")
    List<Patient> findByAssignedDoctorId(@Param("doctorId") Long doctorId);

    /** District-level aggregation for regional summary */
    @Query("SELECT p.district, COUNT(p) FROM Patient p WHERE p.district IS NOT NULL GROUP BY p.district")
    List<Object[]> countByDistrict();
}
