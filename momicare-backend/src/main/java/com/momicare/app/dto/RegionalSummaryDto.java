package com.momicare.app.dto;

import com.momicare.app.entity.RiskScore;
import lombok.Builder;
import lombok.Data;

/** One row per district — no patient IDs or names (anonymized). */
@Data @Builder
public class RegionalSummaryDto {
    private String district;
    private long patientCount;
    private RiskScore.RiskLevel dominantRiskLevel;
}
