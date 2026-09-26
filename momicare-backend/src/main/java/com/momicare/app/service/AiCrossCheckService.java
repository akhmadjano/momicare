package com.momicare.app.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.momicare.app.dto.AiCheckDto;
import com.momicare.app.entity.*;
import com.momicare.app.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.HttpStatus;
import org.springframework.scheduling.annotation.Async;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.*;
import java.util.stream.Collectors;

/**
 * AI Cross-Check Service — Gemini free tier.
 *
 * Uses the free Gemini 1.5 Flash model via REST.
 * Never blocking: all calls are @Async and failures are caught + logged.
 * Rule-based engine is always the source of truth; AI is a review flag only.
 *
 * Free-tier limit (as of 2024): 15 req/min, 1 million tokens/day.
 * Set app.ai.gemini.api-key in application.properties.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AiCrossCheckService {

    private final AiCheckRepository aiCheckRepo;
    private final ReadingRepository readingRepo;
    private final PatientRepository patientRepo;
    private final AlertRepository alertRepo;
    private final ObjectMapper objectMapper;

    @Value("${app.ai.gemini.api-key}")
    private String apiKey;

    @Value("${app.ai.gemini.url}")
    private String geminiUrl;

    @Value("${app.ai.provider}")
    private String provider;

    // ── Async entry point called from ReadingService ──────────────────────────

    @Async
    public void performCrossCheck(Long patientId, Long readingId, RiskScore ruleBasedScore) {
        if ("disabled".equalsIgnoreCase(provider) ||
                apiKey.isBlank() || apiKey.startsWith("YOUR_")) {
            log.info("[AI] Cross-check skipped — no API key configured");
            return;
        }

        try {
            Reading reading = readingRepo.findById(readingId).orElse(null);
            Patient patient = patientRepo.findById(patientId).orElse(null);
            if (reading == null || patient == null) return;

            String prompt = buildPrompt(reading, ruleBasedScore);
            AiResponse aiResponse = callGemini(prompt);

            persistResult(patient, reading, ruleBasedScore, aiResponse);
        } catch (Exception e) {
            log.error("[AI] Cross-check failed for reading={}: {}", readingId, e.getMessage());
            // Never propagate — must not affect reading save
        }
    }

    // ── History endpoint ──────────────────────────────────────────────────────

    @Transactional(readOnly = true)
    public List<AiCheckDto> getAiChecks(Long patientId) {
        return aiCheckRepo.findByPatientIdOrderByCheckedAtDesc(patientId).stream()
                .map(this::toDto)
                .collect(Collectors.toList());
    }

    // ── Gemini API call ───────────────────────────────────────────────────────

    private AiResponse callGemini(String prompt) {
        WebClient client = WebClient.builder()
                .baseUrl(geminiUrl + "?key=" + apiKey)
                .build();

        Map<String, Object> requestBody = Map.of(
                "contents", List.of(Map.of(
                        "parts", List.of(Map.of("text", prompt))
                )),
                "generationConfig", Map.of(
                        "temperature", 0.2,
                        "maxOutputTokens", 300
                )
        );

        String rawResponse = client.post()
                .bodyValue(requestBody)
                .retrieve()
                .bodyToMono(String.class)
                .timeout(Duration.ofSeconds(15))
                .block();

        return parseGeminiResponse(rawResponse);
    }

    private AiResponse parseGeminiResponse(String raw) {
        try {
            JsonNode root = objectMapper.readTree(raw);
            String text = root.path("candidates").get(0)
                    .path("content").path("parts").get(0)
                    .path("text").asText();

            // Expect JSON in response: {"ai_risk_level": "High", "ai_reasoning": "..."}
            // Strip markdown code fences if present
            text = text.replaceAll("```json", "").replaceAll("```", "").trim();
            JsonNode parsed = objectMapper.readTree(text);

            String levelStr = parsed.path("ai_risk_level").asText("Low");
            String reasoning = parsed.path("ai_reasoning").asText("No reasoning provided");

            RiskScore.RiskLevel level;
            try {
                level = RiskScore.RiskLevel.valueOf(levelStr);
            } catch (IllegalArgumentException e) {
                level = RiskScore.RiskLevel.Low;
            }

            return new AiResponse(level, reasoning);
        } catch (Exception e) {
            log.warn("[AI] Failed to parse Gemini response: {}", e.getMessage());
            throw new RuntimeException("Failed to parse AI response", e);
        }
    }

    // ── Persist result ────────────────────────────────────────────────────────

    @Transactional
    protected void persistResult(Patient patient, Reading reading,
                                  RiskScore ruleScore, AiResponse aiResponse) {
        AiCheck.MatchStatus matchStatus = aiResponse.level().equals(ruleScore.getRiskLevel())
                ? AiCheck.MatchStatus.MATCH
                : AiCheck.MatchStatus.MISMATCH;

        AiCheck check = aiCheckRepo.save(AiCheck.builder()
                .patient(patient)
                .reading(reading)
                .ruleBasedRiskLevel(ruleScore.getRiskLevel())
                .aiRiskLevel(aiResponse.level())
                .aiReasoning(aiResponse.reasoning())
                .matchStatus(matchStatus)
                .build());

        log.info("[AI] Check saved — patient={}, match={}, rule={}, ai={}",
                patient.getId(), matchStatus, ruleScore.getRiskLevel(), aiResponse.level());

        // If MISMATCH and AI severity is HIGHER → flag related alert
        if (matchStatus == AiCheck.MatchStatus.MISMATCH
                && aiResponse.level().ordinal() > ruleScore.getRiskLevel().ordinal()) {
            alertRepo.findByPatientIdOrderByCreatedAtDesc(patient.getId())
                    .stream().findFirst().ifPresent(alert -> {
                        alert.setNeedsAiReview(true);
                        alertRepo.save(alert);
                        log.warn("[AI] Flagged alert id={} for review — AI level {} > rule level {}",
                                alert.getId(), aiResponse.level(), ruleScore.getRiskLevel());
                    });
        }
    }

    // ── Prompt builder ────────────────────────────────────────────────────────

    private String buildPrompt(Reading reading, RiskScore ruleScore) {
        return """
                You are a clinical decision support assistant reviewing maternal health data.
                Assess the risk level independently based ONLY on the data provided.
                
                Patient reading:
                - Blood pressure: %s
                - Heart rate: %s bpm
                - Symptoms: %s
                
                Rule-based system assessed risk level: %s
                
                Respond with ONLY a JSON object (no markdown, no extra text):
                {"ai_risk_level": "<Low|Moderate|High|Critical>", "ai_reasoning": "<one or two sentences>"}
                """.formatted(
                reading.getBloodPressure() != null ? reading.getBloodPressure() : "not recorded",
                reading.getHeartRate() != null ? reading.getHeartRate().toString() : "not recorded",
                reading.getSymptoms() != null ? reading.getSymptoms() : "none reported",
                ruleScore.getRiskLevel()
        );
    }

    private AiCheckDto toDto(AiCheck c) {
        return AiCheckDto.builder()
                .id(c.getId())
                .patientId(c.getPatient().getId())
                .readingId(c.getReading() != null ? c.getReading().getId() : null)
                .ruleBasedRiskLevel(c.getRuleBasedRiskLevel())
                .aiRiskLevel(c.getAiRiskLevel())
                .aiReasoning(c.getAiReasoning())
                .matchStatus(c.getMatchStatus())
                .checkedAt(c.getCheckedAt())
                .build();
    }

    private record AiResponse(RiskScore.RiskLevel level, String reasoning) {}
}
