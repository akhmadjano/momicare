package com.momicare.app.controller;

import com.momicare.app.security.AppUserDetails;
import com.momicare.app.service.DoctorAssignmentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/doctors")
@RequiredArgsConstructor
public class DoctorAssignmentController {

    private final DoctorAssignmentService assignmentService;

    /**
     * POST /api/doctors/{doctorId}/patients/{patientId}
     * Admin only. Assign a patient to a doctor.
     */
    @PostMapping("/{doctorId}/patients/{patientId}")
    public ResponseEntity<Map<String, String>> assignPatient(
            @PathVariable Long doctorId,
            @PathVariable Long patientId,
            @AuthenticationPrincipal AppUserDetails caller) {
        assignmentService.assignPatient(doctorId, patientId, caller);
        return ResponseEntity.ok(Map.of("message",
                "Patient " + patientId + " assigned to doctor " + doctorId));
    }
}
