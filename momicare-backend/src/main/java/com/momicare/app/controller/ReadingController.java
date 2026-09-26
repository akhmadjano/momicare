package com.momicare.app.controller;

import com.momicare.app.dto.*;
import com.momicare.app.security.AppUserDetails;
import com.momicare.app.service.*;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;
import java.util.Map;

// NOTE: AiCrossCheckService is injected here for the ai-checks history endpoint

@RestController
@RequestMapping("/api/patients/{patientId}")
@RequiredArgsConstructor
public class ReadingController {

    private final ReadingService readingService;
    private final RiskEngineService riskEngine;
    private final AccessControlService acl;
    private final AiCrossCheckService aiCrossCheckService;

    /**
     * POST /api/patients/{id}/readings
     * Submit vitals. Saves, recalculates risk, triggers async AI check.
     * Returns updated risk result immediately.
     */
    @PostMapping("/readings")
    public ResponseEntity<RiskResultDto> submitReading(
            @PathVariable Long patientId,
            @Valid @RequestBody SubmitReadingRequest req,
            @AuthenticationPrincipal AppUserDetails caller) {
        return ResponseEntity.ok(readingService.submitReading(patientId, req, caller));
    }

    /**
     * POST /api/patients/{id}/readings/parse-voice
     * Parse raw text transcript → fields. Never saves.
     * Body: { "text": "Qon bosimi 135 ga 85, yurak urishi 88" }
     */
    @PostMapping("/readings/parse-voice")
    public ResponseEntity<ParsedReadingDto> parseVoice(
            @PathVariable Long patientId,
            @RequestBody Map<String, String> body,
            @AuthenticationPrincipal AppUserDetails caller) {
        String text = body.getOrDefault("text", "");
        return ResponseEntity.ok(readingService.parseVoiceText(patientId, text, caller));
    }

    /**
     * POST /api/patients/{id}/readings/voice
     * Accepts multipart audio, transcribes via SpeechToTextService,
     * parses transcript → fields. Never saves. Returns transcript + parsed fields.
     */
    @PostMapping(value = "/readings/voice", consumes = "multipart/form-data")
    public ResponseEntity<ParsedReadingDto> parseVoiceAudio(
            @PathVariable Long patientId,
            @RequestPart("audio") MultipartFile audioFile,
            @AuthenticationPrincipal AppUserDetails caller) {
        return ResponseEntity.ok(readingService.parseVoiceAudio(patientId, audioFile, caller));
    }

    /**
     * GET /api/patients/{id}/risk
     * Current risk level, trend, and 2-4 plain-language key factors.
     */
    @GetMapping("/risk")
    public ResponseEntity<RiskResultDto> getRisk(
            @PathVariable Long patientId,
            @AuthenticationPrincipal AppUserDetails caller) {
        acl.assertCanAccessPatient(caller, patientId);
        return ResponseEntity.ok(riskEngine.getCurrentRisk(patientId));
    }

    /**
     * GET /api/patients/{id}/risk/history
     * All risk scores over time for charting trend.
     */
    @GetMapping("/risk/history")
    public ResponseEntity<List<RiskResultDto>> getRiskHistory(
            @PathVariable Long patientId,
            @AuthenticationPrincipal AppUserDetails caller) {
        acl.assertCanAccessPatient(caller, patientId);
        return ResponseEntity.ok(riskEngine.getRiskHistory(patientId));
    }

    /**
     * GET /api/patients/{id}/instructions
     * Rule-based plain-language guidance derived from current risk.
     */
    @GetMapping("/instructions")
    public ResponseEntity<InstructionsDto> getInstructions(
            @PathVariable Long patientId,
            @AuthenticationPrincipal AppUserDetails caller) {
        acl.assertCanAccessPatient(caller, patientId);
        return ResponseEntity.ok(riskEngine.getInstructions(patientId));
    }

    /**
     * GET /api/patients/{id}/risk/ai-checks
     * History of AI checks for a patient, most recent first.
     */
    @GetMapping("/risk/ai-checks")
    public ResponseEntity<List<AiCheckDto>> getAiChecks(
            @PathVariable Long patientId,
            @AuthenticationPrincipal AppUserDetails caller) {
        acl.assertCanAccessPatient(caller, patientId);
        return ResponseEntity.ok(aiCrossCheckService.getAiChecks(patientId));
    }
}
