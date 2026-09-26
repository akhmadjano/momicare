package com.momicare.app.service;

import com.momicare.app.dto.ParsedReadingDto;
import org.springframework.stereotype.Service;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Simple regex parser for voice transcripts in Uzbek and English.
 * Extracts bloodPressure and heartRate — never saves anything.
 *
 * Examples it handles:
 *  "Qon bosimi 135 ga 85, yurak urishi 88"          → 135/85, 88
 *  "blood pressure 120 over 80 heart rate 76"        → 120/80, 76
 *  "bosim 140/90 puls 95"                            → 140/90, 95
 */
@Service
public class VoiceParserService {

    // BP patterns: "135 ga 85" | "135/85" | "135 over 85" | "135 to 85"
    private static final Pattern BP_PATTERN = Pattern.compile(
            "(\\d{2,3})\\s*(?:ga|over|to|/)\\s*(\\d{2,3})",
            Pattern.CASE_INSENSITIVE);

    // HR patterns: "yurak urishi 88" | "heart rate 88" | "puls 88" | "pulse 88" | "hr 88"
    private static final Pattern HR_PATTERN = Pattern.compile(
            "(?:yurak\\s*urishi|heart\\s*rate|puls(?:e)?|hr)\\s*(\\d{2,3})",
            Pattern.CASE_INSENSITIVE);

    public ParsedReadingDto parse(String transcript) {
        if (transcript == null) transcript = "";

        String bp = null;
        Integer hr = null;

        Matcher bpMatcher = BP_PATTERN.matcher(transcript);
        if (bpMatcher.find()) {
            bp = bpMatcher.group(1) + "/" + bpMatcher.group(2);
        }

        Matcher hrMatcher = HR_PATTERN.matcher(transcript);
        if (hrMatcher.find()) {
            try {
                hr = Integer.parseInt(hrMatcher.group(1));
            } catch (NumberFormatException ignored) {}
        }

        return ParsedReadingDto.builder()
                .rawTranscript(null)
                .bloodPressure(bp)
                .heartRate(hr)
                .symptoms(null)
                .build();
    }
}
