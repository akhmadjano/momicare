package com.momicare.app.service;

import com.momicare.app.dto.InstructionsDto;
import com.momicare.app.dto.RiskResultDto;
import com.momicare.app.entity.*;
import com.momicare.app.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.util.*;
import java.util.stream.Collectors;

/**
 * Rule-based risk engine — always the source of truth.
 *
 * Rules:
 *  - Critical threshold breached → Critical
 *  - 3+ worsening indicators → High
 *  - 2 consecutive worsening key indicators → Moderate
 *  - Otherwise → Low
 *
 * Trend computed from full reading history (last 3 risk scores).
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class RiskEngineService {

    private final ReadingRepository readingRepo;
    private final RiskScoreRepository riskScoreRepo;

    // ── Thresholds ────────────────────────────────────────────────────────────
    private static final int SYSTOLIC_CRITICAL  = 160;
    private static final int DIASTOLIC_CRITICAL = 105;
    private static final int SYSTOLIC_HIGH      = 140;
    private static final int DIASTOLIC_HIGH     = 90;
    private static final int HEART_RATE_HIGH    = 100;
    private static final int HEART_RATE_CRITICAL= 120;

    private static final Set<String> CRITICAL_SYMPTOMS = Set.of(
            "blurred vision", "visual disturbances", "severe headache",
            "upper abdominal pain", "seizure", "convulsion", "unconscious",
            "no fetal movement"
    );
    private static final Set<String> WARNING_SYMPTOMS = Set.of(
            "headache", "dizziness", "swelling", "nausea", "fatigue",
            "shortness of breath", "chest pain", "reduced fetal movement"
    );

    // ── Recalculate and persist ───────────────────────────────────────────────

    @Transactional
    public RiskScore recalculateAndSave(Patient patient) {
        List<Reading> readings = readingRepo.findByPatientIdOrderByRecordedAtAsc(patient.getId());

        RiskAssessment assessment = assess(readings);
        RiskScore.Trend trend     = computeTrend(patient.getId(), assessment.level);

        RiskScore score = RiskScore.builder()
                .patient(patient)
                .riskLevel(assessment.level)
                .trend(trend)
                .keyFactors(assessment.factors)
                .calculatedAt(Instant.now())
                .build();

        return riskScoreRepo.save(score);
    }

    /** Read-only current risk (no persist). */
    @Transactional(readOnly = true)
    public RiskResultDto getCurrentRisk(Long patientId) {
        return riskScoreRepo.findLatestByPatientId(patientId)
                .map(rs -> RiskResultDto.builder()
                        .riskLevel(rs.getRiskLevel())
                        .trend(rs.getTrend())
                        .keyFactors(rs.getKeyFactors())
                        .calculatedAt(rs.getCalculatedAt())
                        .build())
                .orElse(RiskResultDto.builder()
                        .riskLevel(RiskScore.RiskLevel.Low)
                        .trend(RiskScore.Trend.stable)
                        .keyFactors(List.of("No readings yet"))
                        .calculatedAt(Instant.now())
                        .build());
    }

    @Transactional(readOnly = true)
    public List<RiskResultDto> getRiskHistory(Long patientId) {
        return riskScoreRepo.findByPatientIdOrderByCalculatedAtAsc(patientId).stream()
                .map(rs -> RiskResultDto.builder()
                        .riskLevel(rs.getRiskLevel())
                        .trend(rs.getTrend())
                        .keyFactors(rs.getKeyFactors())
                        .calculatedAt(rs.getCalculatedAt())
                        .build())
                .collect(Collectors.toList());
    }

    // ── Instruction generator — reuses risk engine output ────────────────────

    @Transactional(readOnly = true)
    public InstructionsDto getInstructions(Long patientId) {
        RiskResultDto risk = getCurrentRisk(patientId);
        return buildInstructions(risk);
    }

    public InstructionsDto buildInstructions(RiskResultDto risk) {
        String basedOn = "Risk level: " + risk.getRiskLevel() +
                ", Trend: " + risk.getTrend() +
                ". Key factors: " + String.join("; ", risk.getKeyFactors());

        return switch (risk.getRiskLevel()) {
            case Critical -> InstructionsDto.builder()
                    .headline("Seek emergency medical care immediately")
                    .tips(List.of(
                            "Go to the nearest hospital or call emergency services now",
                            "Do not drive yourself — ask someone to take you",
                            "Tell medical staff about your symptoms and blood pressure readings",
                            "Do not wait — critical symptoms require urgent evaluation"
                    ))
                    .basedOn(basedOn)
                    .build();

            case High -> InstructionsDto.builder()
                    .headline("Contact your doctor or midwife today")
                    .tips(List.of(
                            "Call your healthcare provider and describe your current symptoms",
                            "Rest and avoid strenuous activity",
                            "Monitor your blood pressure every few hours if possible",
                            "Go to the emergency room if symptoms worsen or you develop vision changes"
                    ))
                    .basedOn(basedOn)
                    .build();

            case Moderate -> InstructionsDto.builder()
                    .headline("Schedule an appointment within 24–48 hours")
                    .tips(List.of(
                            "Inform your nurse or midwife about your recent readings",
                            "Rest adequately and reduce salt intake",
                            "Track symptoms — note any new or worsening signs",
                            "Attend your next scheduled antenatal visit"
                    ))
                    .basedOn(basedOn)
                    .build();

            case Low -> InstructionsDto.builder()
                    .headline("Continue normal antenatal care")
                    .tips(List.of(
                            "Attend all scheduled check-up appointments",
                            "Stay hydrated and maintain a balanced diet",
                            "Engage in light, doctor-approved physical activity",
                            "Report any new or unusual symptoms promptly"
                    ))
                    .basedOn(basedOn)
                    .build();
        };
    }

    // ── Internal assessment logic ─────────────────────────────────────────────

    record RiskAssessment(RiskScore.RiskLevel level, List<String> factors) {}

    private RiskAssessment assess(List<Reading> readings) {
        if (readings.isEmpty()) {
            return new RiskAssessment(RiskScore.RiskLevel.Low, List.of("No readings available"));
        }

        Reading latest = readings.get(readings.size() - 1);
        List<String> factors = new ArrayList<>();
        int worseningCount = 0;

        // ── Blood pressure analysis ───────────────────────────────────────────
        int[] bp = parseBp(latest.getBloodPressure());
        if (bp != null) {
            int systolic = bp[0], diastolic = bp[1];

            if (systolic >= SYSTOLIC_CRITICAL || diastolic >= DIASTOLIC_CRITICAL) {
                factors.add(String.format("BP dangerously high (%d/%d) — critical threshold exceeded", systolic, diastolic));
                return new RiskAssessment(RiskScore.RiskLevel.Critical, factors);
            } else if (systolic >= SYSTOLIC_HIGH || diastolic >= DIASTOLIC_HIGH) {
                factors.add(String.format("BP significantly elevated (%d/%d)", systolic, diastolic));
                worseningCount++;
            } else if (systolic >= 130 || diastolic >= 85) {
                factors.add(String.format("BP mildly elevated (%d/%d)", systolic, diastolic));
                worseningCount++;
            } else {
                factors.add(String.format("BP within normal range (%d/%d)", systolic, diastolic));
            }

            // Check trend from last two readings
            if (readings.size() >= 2) {
                Reading prev = readings.get(readings.size() - 2);
                int[] prevBp = parseBp(prev.getBloodPressure());
                if (prevBp != null && (systolic > prevBp[0] + 10 || diastolic > prevBp[1] + 5)) {
                    factors.add("BP rising compared to previous reading");
                    worseningCount++;
                }
            }
        }

        // ── Heart rate analysis ───────────────────────────────────────────────
        if (latest.getHeartRate() != null) {
            int hr = latest.getHeartRate();
            if (hr >= HEART_RATE_CRITICAL) {
                factors.add("Heart rate critically elevated (" + hr + " bpm)");
                return new RiskAssessment(RiskScore.RiskLevel.Critical, factors);
            } else if (hr >= HEART_RATE_HIGH) {
                factors.add("Heart rate elevated (" + hr + " bpm)");
                worseningCount++;
            } else {
                factors.add("Heart rate normal (" + hr + " bpm)");
            }
        }

        // ── Symptom analysis ──────────────────────────────────────────────────
        if (latest.getSymptoms() != null && !latest.getSymptoms().isBlank()) {
            String symptomsLower = latest.getSymptoms().toLowerCase();

            boolean hasCritical = CRITICAL_SYMPTOMS.stream().anyMatch(symptomsLower::contains);
            boolean hasWarning  = WARNING_SYMPTOMS.stream().anyMatch(symptomsLower::contains);

            if (hasCritical) {
                factors.add("Critical symptom reported: " + latest.getSymptoms());
                return new RiskAssessment(RiskScore.RiskLevel.Critical, factors);
            } else if (hasWarning) {
                factors.add("Warning symptom(s) reported: " + latest.getSymptoms());
                worseningCount++;
            } else {
                factors.add("Symptoms reported: " + latest.getSymptoms());
            }
        } else {
            factors.add("No symptoms reported");
        }

        // ── Final classification ──────────────────────────────────────────────
        RiskScore.RiskLevel level;
        if (worseningCount >= 3) {
            level = RiskScore.RiskLevel.High;
        } else if (worseningCount >= 2) {
            level = RiskScore.RiskLevel.Moderate;
        } else {
            level = RiskScore.RiskLevel.Low;
        }

        // Limit to 4 key factors
        List<String> topFactors = factors.stream().limit(4).collect(Collectors.toList());
        return new RiskAssessment(level, topFactors);
    }

    /**
     * Compute trend from the last 3 risk scores.
     * If not enough history, returns stable.
     */
    private RiskScore.Trend computeTrend(Long patientId, RiskScore.RiskLevel newLevel) {
        List<RiskScore> history = riskScoreRepo.findByPatientIdOrderByCalculatedAtDesc(patientId);

        if (history.isEmpty()) return RiskScore.Trend.stable;

        // Compare current to last recorded level
        RiskScore last = history.get(0);
        int comparison = newLevel.ordinal() - last.getRiskLevel().ordinal();

        if (history.size() >= 2) {
            RiskScore prev = history.get(1);
            int prevComparison = last.getRiskLevel().ordinal() - prev.getRiskLevel().ordinal();

            // Both steps moving same direction
            if (comparison > 0 && prevComparison >= 0) return RiskScore.Trend.increasing;
            if (comparison < 0 && prevComparison <= 0) return RiskScore.Trend.decreasing;
        }

        if (comparison > 0) return RiskScore.Trend.increasing;
        if (comparison < 0) return RiskScore.Trend.decreasing;
        return RiskScore.Trend.stable;
    }

    /** Parse "120/80" → [120, 80]. Returns null if unparseable. */
    public static int[] parseBp(String bp) {
        if (bp == null || bp.isBlank()) return null;
        String[] parts = bp.trim().split("[/\\\\-]");
        if (parts.length < 2) return null;
        try {
            return new int[]{Integer.parseInt(parts[0].trim()), Integer.parseInt(parts[1].trim())};
        } catch (NumberFormatException e) {
            return null;
        }
    }
}
