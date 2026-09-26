package com.momicare.app.service;

import com.momicare.app.entity.Patient;
import com.momicare.app.entity.User;
import com.momicare.app.repository.PatientRepository;
import com.momicare.app.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

/**
 * Single place for patient-level access checks.
 * Controllers call assertCanAccessPatient(principal, patientId) instead of
 * duplicating authorization logic.
 */
@Service
@RequiredArgsConstructor
public class AccessControlService {

    private final PatientRepository patientRepo;

    /**
     * Throws 403 if the caller is not allowed to access the given patient.
     *
     * Rules:
     *  - admin  → always allowed
     *  - nurse  → always allowed
     *  - doctor → only their assigned patients
     *  - patient→ only their own patient record
     */
    public void assertCanAccessPatient(AppUserDetails caller, Long patientId) {
        String role = caller.getRole();

        if ("admin".equals(role) || "nurse".equals(role)) {
            return; // unrestricted
        }

        if ("doctor".equals(role)) {
            Patient patient = patientRepo.findById(patientId)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));
            boolean assigned = patient.getAssignedDoctors().stream()
                    .anyMatch(d -> d.getId().equals(caller.getUserId()));
            if (!assigned) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Doctor not assigned to this patient");
            }
            return;
        }

        if ("patient".equals(role)) {
            if (!patientId.equals(caller.getPatientId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Patients may only access their own record");
            }
            return;
        }

        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
    }

    /**
     * Throws 403 if the caller is not one of the allowed roles.
     */
    public void assertRole(AppUserDetails caller, String... allowedRoles) {
        String role = caller.getRole();
        for (String allowed : allowedRoles) {
            if (allowed.equals(role)) return;
        }
        throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                "Role '" + role + "' is not permitted for this operation");
    }

    /** Convenience: returns the authenticated AppUserDetails from the security context. */
    public static AppUserDetails currentUser() {
        var auth = org.springframework.security.core.context.SecurityContextHolder
                .getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof AppUserDetails ud) {
            return ud;
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Not authenticated");
    }
}
