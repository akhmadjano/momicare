package com.momicare.app.controller;

import com.momicare.app.dto.*;
import com.momicare.app.security.AppUserDetails;
import com.momicare.app.service.AccessControlService;
import com.momicare.app.service.PatientService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients")
@RequiredArgsConstructor
public class PatientController {

    private final PatientService patientService;

    /**
     * POST /api/patients
     * Nurse or admin creates a patient record, optionally assigning a doctor.
     */
    @PostMapping
    public ResponseEntity<PatientDetailDto> createPatient(
            @Valid @RequestBody CreatePatientRequest req,
            @AuthenticationPrincipal AppUserDetails caller) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(patientService.createPatient(req, caller));
    }

    /**
     * GET /api/patients
     * Role-scoped list: admin/nurse → all; doctor → assigned only; patient → 403.
     * Each row includes current risk level + trend.
     */
    @GetMapping
    public ResponseEntity<List<PatientSummaryDto>> listPatients(
            @AuthenticationPrincipal AppUserDetails caller) {
        return ResponseEntity.ok(patientService.listPatients(caller));
    }

    /**
     * GET /api/patients/{id}
     * Full profile + reading history.
     * Patient may only fetch their own; doctor only their assigned; admin/nurse unrestricted.
     */
    @GetMapping("/{id}")
    public ResponseEntity<PatientDetailDto> getPatient(
            @PathVariable Long id,
            @AuthenticationPrincipal AppUserDetails caller) {
        return ResponseEntity.ok(patientService.getPatient(id, caller));
    }
}
