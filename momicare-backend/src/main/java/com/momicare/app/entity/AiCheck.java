package com.momicare.app.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.Instant;

@Entity
@Table(name = "ai_checks")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AiCheck {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "reading_id")
    private Reading reading;

    @Enumerated(EnumType.STRING)
    @Column(name = "rule_based_risk_level")
    private RiskScore.RiskLevel ruleBasedRiskLevel;

    @Enumerated(EnumType.STRING)
    @Column(name = "ai_risk_level")
    private RiskScore.RiskLevel aiRiskLevel;

    @Column(name = "ai_reasoning", columnDefinition = "TEXT")
    private String aiReasoning;

    @Enumerated(EnumType.STRING)
    @Column(name = "match_status")
    private MatchStatus matchStatus;

    @Column(name = "checked_at", nullable = false, updatable = false)
    private Instant checkedAt;

    @PrePersist
    void prePersist() {
        if (checkedAt == null) checkedAt = Instant.now();
    }

    public enum MatchStatus {
        MATCH, MISMATCH
    }
}
