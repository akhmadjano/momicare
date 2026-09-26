package com.momicare.app.dto;

import com.momicare.app.entity.Alert;
import lombok.Builder;
import lombok.Data;
import java.time.Instant;

@Data @Builder
public class AlertDto {
    private Long id;
    private Long patientId;
    private String patientName;
    private Long riskScoreId;
    private Alert.Priority priority;
    private Alert.AlertStatus status;
    private boolean needsAiReview;
    private Instant createdAt;
    private Instant updatedAt;
}
