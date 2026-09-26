package com.momicare.app.dto;

import com.momicare.app.entity.RiskScore;
import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.List;

/** Current risk snapshot — returned after reading save and by GET /risk */
@Data @Builder
public class RiskResultDto {
    private RiskScore.RiskLevel riskLevel;
    private RiskScore.Trend trend;
    private List<String> keyFactors;
    private Instant calculatedAt;
}
