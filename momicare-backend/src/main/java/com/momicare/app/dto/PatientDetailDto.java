package com.momicare.app.dto;

import com.momicare.app.entity.RiskScore;
import lombok.Builder;
import lombok.Data;
import java.time.Instant;
import java.util.List;

/** Returned by GET /api/patients/{id} — full profile + reading history. */
@Data @Builder
public class PatientDetailDto {
    private Long id;
    private String name;
    private String phoneNumber;
    private Integer pregnancyWeek;
    private String district;
    private Instant createdAt;
    private RiskScore.RiskLevel currentRiskLevel;
    private RiskScore.Trend currentTrend;
    private List<String> currentKeyFactors;
    private List<ReadingDto> readings;
    private List<AssignedDoctorDto> assignedDoctors;

    @Data @Builder
    public static class AssignedDoctorDto {
        private Long id;
        private String name;
    }
}
