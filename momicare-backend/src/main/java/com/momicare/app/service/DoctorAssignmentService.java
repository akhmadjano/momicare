package com.momicare.app.service;

import com.momicare.app.entity.*;
import com.momicare.app.repository.PatientRepository;
import com.momicare.app.repository.UserRepository;
import com.momicare.app.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
public class DoctorAssignmentService {

    private final PatientRepository patientRepo;
    private final UserRepository userRepo;
    private final AccessControlService acl;

    @Transactional
    public void assignPatient(Long doctorId, Long patientId, AppUserDetails caller) {
        acl.assertRole(caller, "admin");

        User doctor = userRepo.findById(doctorId)
                .filter(u -> u.getRole() == User.Role.doctor)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Doctor not found: " + doctorId));

        Patient patient = patientRepo.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND,
                        "Patient not found: " + patientId));

        boolean alreadyAssigned = patient.getAssignedDoctors().stream()
                .anyMatch(d -> d.getId().equals(doctorId));

        if (!alreadyAssigned) {
            patient.getAssignedDoctors().add(doctor);
            patientRepo.save(patient);
        }
    }
}
