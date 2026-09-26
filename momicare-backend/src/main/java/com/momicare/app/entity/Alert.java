package com.momicare.app.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "alerts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Alert {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "risk_score_id")
    private RiskScore riskScore;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Priority priority;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AlertStatus status;

    @Column(name = "needs_ai_review", nullable = false)
    @Builder.Default
    private boolean needsAiReview = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private Instant createdAt;

    @Column(name = "updated_at")
    private Instant updatedAt;

    @PrePersist
    void prePersist() {
        Instant now = Instant.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
    }

    @PreUpdate
    void preUpdate() {
        updatedAt = Instant.now();
    }

    public enum Priority {
        Low, Moderate, High, Critical;

        public static Priority fromRiskLevel(RiskScore.RiskLevel level) {
            return switch (level) {
                case Low -> Low;
                case Moderate -> Moderate;
                case High -> High;
                case Critical -> Critical;
            };
        }
    }

    public enum AlertStatus {
        Alert, Reviewed, FollowUpScheduled, Resolved
    }
}
