package com.momicare.app.dto;

import com.momicare.app.entity.RiskScore;
import lombok.Builder;
import lombok.Data;
import java.time.Instant;

/** Returned in list endpoints — one row per patient with current risk snapshot. */
@Data @Builder
public class PatientSummaryDto {
    private Long id;
    private String name;
    private String phoneNumber;
    private Integer pregnancyWeek;
    private String district;
    private Instant createdAt;
    private RiskScore.RiskLevel currentRiskLevel;
    private RiskScore.Trend currentTrend;
    private boolean hasAiReviewFlag;
}
