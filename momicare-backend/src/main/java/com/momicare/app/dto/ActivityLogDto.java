package com.momicare.app.dto;

import com.momicare.app.entity.ActivityLog;
import lombok.Builder;
import lombok.Data;
import java.time.Instant;

@Data @Builder
public class ActivityLogDto {
    private Long id;
    private ActivityLog.ActivityType type;
    private String detail;
    private Instant occurredAt;
}
