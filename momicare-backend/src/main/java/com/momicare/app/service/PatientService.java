package com.momicare.app.service;

import com.momicare.app.dto.*;
import com.momicare.app.entity.*;
import com.momicare.app.repository.*;
import com.momicare.app.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PatientService {

    private final PatientRepository patientRepo;
    private final UserRepository userRepo;
    private final RiskScoreRepository riskScoreRepo;
    private final AlertRepository alertRepo;
    private final ReadingRepository readingRepo;
    private final AccessControlService acl;

    // ── Create patient (nurse / admin) ────────────────────────────────────────

    @Transactional
    public PatientDetailDto createPatient(CreatePatientRequest req, AppUserDetails caller) {
        acl.assertRole(caller, "nurse", "admin");

        Patient patient = Patient.builder()
                .name(req.getName())
                .phoneNumber(req.getPhoneNumber())
                .pregnancyWeek(req.getPregnancyWeek())
                .district(req.getDistrict())
                .build();

        if (req.getAssignDoctorId() != null) {
            User doctor = userRepo.findById(req.getAssignDoctorId())
                    .filter(u -> u.getRole() == User.Role.doctor)
                    .orElseThrow(() -> new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Doctor not found: " + req.getAssignDoctorId()));
            patient.getAssignedDoctors().add(doctor);
        }

        patient = patientRepo.save(patient);
        return toDetail(patient);
    }

    // ── List patients (role-scoped) ───────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<PatientSummaryDto> listPatients(AppUserDetails caller) {
        String role = caller.getRole();

        if ("patient".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Patients cannot list all patients");
        }

        List<Patient> patients = switch (role) {
            case "admin", "nurse" -> patientRepo.findAll();
            case "doctor"         -> patientRepo.findByAssignedDoctorId(caller.getUserId());
            default -> throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        };

        return patients.stream().map(this::toSummary).collect(Collectors.toList());
    }

    // ── Get single patient ───────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public PatientDetailDto getPatient(Long patientId, AppUserDetails caller) {
        acl.assertCanAccessPatient(caller, patientId);
        Patient patient = patientRepo.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));
        return toDetail(patient);
    }

    // ── Mapping helpers ──────────────────────────────────────────────────────

    public PatientSummaryDto toSummary(Patient p) {
        RiskScore latest = riskScoreRepo.findLatestByPatientId(p.getId()).orElse(null);

        boolean aiFlag = alertRepo.findByPatientIdOrderByCreatedAtDesc(p.getId())
                .stream().findFirst()
                .map(Alert::isNeedsAiReview)
                .orElse(false);

        return PatientSummaryDto.builder()
                .id(p.getId())
                .name(p.getName())
                .phoneNumber(p.getPhoneNumber())
                .pregnancyWeek(p.getPregnancyWeek())
                .district(p.getDistrict())
                .createdAt(p.getCreatedAt())
                .currentRiskLevel(latest != null ? latest.getRiskLevel() : null)
                .currentTrend(latest != null ? latest.getTrend() : null)
                .hasAiReviewFlag(aiFlag)
                .build();
    }

    private PatientDetailDto toDetail(Patient p) {
        RiskScore latest = riskScoreRepo.findLatestByPatientId(p.getId()).orElse(null);

        List<ReadingDto> readings = readingRepo
                .findByPatientIdOrderByRecordedAtDesc(p.getId())
                .stream()
                .map(r -> ReadingDto.builder()
                        .id(r.getId())
                        .bloodPressure(r.getBloodPressure())
                        .heartRate(r.getHeartRate())
                        .symptoms(r.getSymptoms())
                        .source(r.getSource())
                        .recordedAt(r.getRecordedAt())
                        .build())
                .collect(Collectors.toList());

        List<PatientDetailDto.AssignedDoctorDto> doctors = p.getAssignedDoctors().stream()
                .map(d -> PatientDetailDto.AssignedDoctorDto.builder()
                        .id(d.getId()).name(d.getName()).build())
                .collect(Collectors.toList());

        return PatientDetailDto.builder()
                .id(p.getId())
                .name(p.getName())
                .phoneNumber(p.getPhoneNumber())
                .pregnancyWeek(p.getPregnancyWeek())
                .district(p.getDistrict())
                .createdAt(p.getCreatedAt())
                .currentRiskLevel(latest != null ? latest.getRiskLevel() : null)
                .currentTrend(latest != null ? latest.getTrend() : null)
                .currentKeyFactors(latest != null ? latest.getKeyFactors() : List.of())
                .readings(readings)
                .assignedDoctors(doctors)
                .build();
    }
}
