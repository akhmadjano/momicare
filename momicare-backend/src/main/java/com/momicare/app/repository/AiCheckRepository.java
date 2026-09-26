package com.momicare.app.repository;

import com.momicare.app.entity.AiCheck;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface AiCheckRepository extends JpaRepository<AiCheck, Long> {
    List<AiCheck> findByPatientIdOrderByCheckedAtDesc(Long patientId);
}
