package com.momicare.app.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.Instant;
import java.util.List;

@Entity
@Table(name = "risk_scores")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RiskScore {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "patient_id", nullable = false)
    private Patient patient;

    @Enumerated(EnumType.STRING)
    @Column(name = "risk_level", nullable = false)
    private RiskLevel riskLevel;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Trend trend;

    /** Stored as JSON array in Postgres */
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "key_factors", columnDefinition = "jsonb")
    private List<String> keyFactors;

    @Column(name = "calculated_at", nullable = false, updatable = false)
    private Instant calculatedAt;

    @PrePersist
    void prePersist() {
        if (calculatedAt == null) calculatedAt = Instant.now();
    }

    public enum RiskLevel {
        Low, Moderate, High, Critical
    }

    public enum Trend {
        increasing, stable, decreasing
    }
}
