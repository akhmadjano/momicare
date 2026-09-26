package com.momicare.app.service;

import com.momicare.app.dto.*;
import com.momicare.app.entity.*;
import com.momicare.app.repository.*;
import com.momicare.app.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReadingService {

    private final PatientRepository patientRepo;
    private final ReadingRepository readingRepo;
    private final ActivityLogRepository activityLogRepo;
    private final RiskEngineService riskEngine;
    private final AlertService alertService;
    private final VoiceParserService voiceParser;
    private final SpeechToTextService sttService;
    private final AccessControlService acl;
    private final AiCrossCheckService aiCrossCheck;

    // ── Submit a reading ──────────────────────────────────────────────────────

    @Transactional
    public RiskResultDto submitReading(Long patientId, SubmitReadingRequest req,
                                       AppUserDetails caller) {
        acl.assertCanAccessPatient(caller, patientId);

        Patient patient = patientRepo.findById(patientId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Patient not found"));

        Reading reading = readingRepo.save(Reading.builder()
                .patient(patient)
                .bloodPressure(req.getBloodPressure())
                .heartRate(req.getHeartRate())
                .symptoms(req.getSymptoms())
                .source(req.getSource())
                .build());

        // Log to activity_log
        activityLogRepo.save(ActivityLog.builder()
                .patient(patient)
                .type(ActivityLog.ActivityType.reading)
                .detail(String.format("Reading recorded — BP: %s, HR: %s, Source: %s",
                        req.getBloodPressure(), req.getHeartRate(), req.getSource()))
                .build());

        // Recalculate risk (synchronous)
        RiskScore score = riskEngine.recalculateAndSave(patient);

        // Create alert if needed (synchronous)
        alertService.createAlertIfNeeded(patient, score);

        // Async AI cross-check — must not block or fail this response
        final Long readingId = reading.getId();
        final Long patId = patientId;
        try {
            aiCrossCheck.performCrossCheck(patId, readingId, score);
        } catch (Exception e) {
            log.warn("AI cross-check dispatch failed for reading {}: {}", readingId, e.getMessage());
        }

        return RiskResultDto.builder()
                .riskLevel(score.getRiskLevel())
                .trend(score.getTrend())
                .keyFactors(score.getKeyFactors())
                .calculatedAt(score.getCalculatedAt())
                .build();
    }

    // ── Parse voice text (no save) ────────────────────────────────────────────

    public ParsedReadingDto parseVoiceText(Long patientId, String rawText, AppUserDetails caller) {
        acl.assertCanAccessPatient(caller, patientId);
        ParsedReadingDto parsed = voiceParser.parse(rawText);
        parsed.setRawTranscript(rawText);
        return parsed;
    }

    // ── Transcribe + parse audio (no save) ───────────────────────────────────

    public ParsedReadingDto parseVoiceAudio(Long patientId, MultipartFile audioFile,
                                            AppUserDetails caller) {
        acl.assertCanAccessPatient(caller, patientId);
        String transcript = sttService.transcribe(audioFile);
        ParsedReadingDto parsed = voiceParser.parse(transcript);
        parsed.setRawTranscript(transcript);
        return parsed;
    }
}
