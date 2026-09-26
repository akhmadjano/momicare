package com.momicare.app.dto;

import lombok.Builder;
import lombok.Data;

/** Returned by /parse-voice and /readings/voice — never auto-saved. */
@Data @Builder
public class ParsedReadingDto {
    private String rawTranscript;   // null for text-based parse
    private String bloodPressure;
    private Integer heartRate;
    private String symptoms;
}
