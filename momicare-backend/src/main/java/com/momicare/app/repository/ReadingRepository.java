package com.momicare.app.repository;

import com.momicare.app.entity.Reading;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReadingRepository extends JpaRepository<Reading, Long> {
    List<Reading> findByPatientIdOrderByRecordedAtAsc(Long patientId);
    List<Reading> findByPatientIdOrderByRecordedAtDesc(Long patientId);
}
