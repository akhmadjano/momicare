package com.momicare.app.service;

import com.momicare.app.dto.AlertDto;
import com.momicare.app.dto.UpdateAlertRequest;
import com.momicare.app.entity.*;
import com.momicare.app.repository.AlertRepository;
import com.momicare.app.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AlertService {

    private final AlertRepository alertRepo;
    private final AccessControlService acl;

    @Value("${app.alerts.escalation-window-minutes}")
    private int escalationWindowMinutes;

    // ── Auto-create alert after risk recalculation ────────────────────────────

    @Transactional
    public void createAlertIfNeeded(Patient patient, RiskScore score) {
        if (score.getRiskLevel() == RiskScore.RiskLevel.Low) return;

        Alert alert = Alert.builder()
                .patient(patient)
                .riskScore(score)
                .priority(Alert.Priority.fromRiskLevel(score.getRiskLevel()))
                .status(Alert.AlertStatus.Alert)
                .needsAiReview(false)
                .build();

        alertRepo.save(alert);
        log.info("Alert created — patient={}, priority={}", patient.getId(), alert.getPriority());
    }

    // ── Get alerts (role-scoped) ──────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AlertDto> getAlerts(AppUserDetails caller) {
        String role = caller.getRole();

        if ("patient".equals(role) || "nurse".equals(role)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Role '" + role + "' cannot access alerts");
        }

        List<Alert> alerts = switch (role) {
            case "admin"  -> alertRepo.findAllOrderedByPriority();
            case "doctor" -> alertRepo.findByDoctorOrderedByPriority(caller.getUserId());
            default -> throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied");
        };

        return groupLowPriorityAlerts(alerts);
    }

    // ── Update alert status ───────────────────────────────────────────────────

    @Transactional
    public AlertDto updateAlert(Long alertId, UpdateAlertRequest req, AppUserDetails caller) {
        acl.assertRole(caller, "doctor", "admin");

        Alert alert = alertRepo.findById(alertId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Alert not found"));

        // Doctor can only update alerts for their assigned patients
        if ("doctor".equals(caller.getRole())) {
            acl.assertCanAccessPatient(caller, alert.getPatient().getId());
        }

        alert.setStatus(req.getStatus());
        alertRepo.save(alert);
        return toDto(alert);
    }

    // ── Scheduled escalation check ────────────────────────────────────────────

    /**
     * Every 5 minutes, flag Critical alerts that have been unreviewed
     * past the configured window. Logs/flags — doesn't change status (MVP).
     */
    @Scheduled(fixedDelay = 300_000) // 5 minutes
    @Transactional
    public void escalateUnreviewedCriticalAlerts() {
        Instant cutoff = Instant.now().minus(escalationWindowMinutes, ChronoUnit.MINUTES);
        List<Alert> stale = alertRepo.findUnreviewedCriticalBefore(cutoff);

        for (Alert alert : stale) {
            log.warn("[ESCALATION] Critical alert id={} for patient={} has been unreviewed for over {} minutes",
                    alert.getId(), alert.getPatient().getId(), escalationWindowMinutes);
            // MVP: flag needs_ai_review as an escalation signal
            if (!alert.isNeedsAiReview()) {
                alert.setNeedsAiReview(true);
                alertRepo.save(alert);
            }
        }

        if (!stale.isEmpty()) {
            log.warn("[ESCALATION] {} critical alert(s) flagged for escalation", stale.size());
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Group repeated Low-priority alerts for the same patient into a single
     * digest entry (keeping the most recent, noting the count in detail).
     * Higher-priority alerts are returned unchanged.
     */
    private List<AlertDto> groupLowPriorityAlerts(List<Alert> alerts) {
        // Separate Low from the rest
        var nonLow = alerts.stream()
                .filter(a -> a.getPriority() != Alert.Priority.Low)
                .map(this::toDto)
                .collect(Collectors.toList());

        // Group Low by patient, keep most recent per patient
        var lowByPatient = alerts.stream()
                .filter(a -> a.getPriority() == Alert.Priority.Low)
                .collect(Collectors.groupingBy(a -> a.getPatient().getId()));

        lowByPatient.forEach((patientId, group) -> {
            Alert latest = group.stream()
                    .max((a, b) -> a.getCreatedAt().compareTo(b.getCreatedAt()))
                    .orElseThrow();
            AlertDto dto = toDto(latest);
            // Annotate if there are multiple
            if (group.size() > 1) {
                dto.setPatientName(dto.getPatientName() + " (" + group.size() + " low-priority alerts)");
            }
            nonLow.add(dto);
        });

        return nonLow;
    }

    public AlertDto toDto(Alert a) {
        return AlertDto.builder()
                .id(a.getId())
                .patientId(a.getPatient().getId())
                .patientName(a.getPatient().getName())
                .riskScoreId(a.getRiskScore() != null ? a.getRiskScore().getId() : null)
                .priority(a.getPriority())
                .status(a.getStatus())
                .needsAiReview(a.isNeedsAiReview())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}
