package com.momicare.app.dto;

import com.momicare.app.entity.AiCheck;
import com.momicare.app.entity.RiskScore;
import lombok.Builder;
import lombok.Data;
import java.time.Instant;

@Data @Builder
public class AiCheckDto {
    private Long id;
    private Long patientId;
    private Long readingId;
    private RiskScore.RiskLevel ruleBasedRiskLevel;
    private RiskScore.RiskLevel aiRiskLevel;
    private String aiReasoning;
    private AiCheck.MatchStatus matchStatus;
    private Instant checkedAt;
}
