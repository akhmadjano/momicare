package com.momicare.app.config;

import com.momicare.app.entity.*;
import com.momicare.app.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.List;

/**
 * Seeds demo data on first startup when the DB is empty.
 * Safe to re-run — only inserts when no users exist.
 *
 * Demo credentials:
 *  Patient  : phone 998901234567   (phone-only login)
 *  Nurse    : username=nurse1      password=demo1234
 *  Doctor   : username=doctor1     password=demo1234
 *  Admin    : username=admin1      password=demo1234
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class DataSeeder implements CommandLineRunner {

    private final UserRepository userRepo;
    private final PatientRepository patientRepo;
    private final ReadingRepository readingRepo;
    private final RiskScoreRepository riskScoreRepo;
    private final AlertRepository alertRepo;
    private final ActivityLogRepository activityLogRepo;
    private final PasswordEncoder passwordEncoder;

    @Override
    @Transactional
    public void run(String... args) {
        if (userRepo.count() > 0) {
            log.info("Demo data already present — skipping seed.");
            return;
        }

        log.info("Seeding demo data...");

        // ── Staff users ──────────────────────────────────────────────────────
        User nurse = userRepo.save(User.builder()
                .name("Nilufar Qodirova").role(User.Role.nurse)
                .username("nurse1").passwordHash(passwordEncoder.encode("demo1234"))
                .build());

        User doctor = userRepo.save(User.builder()
                .name("Dr. Bobur Toshmatov").role(User.Role.doctor)
                .username("doctor1").passwordHash(passwordEncoder.encode("demo1234"))
                .build());

        userRepo.save(User.builder()
                .name("Admin User").role(User.Role.admin)
                .username("admin1").passwordHash(passwordEncoder.encode("demo1234"))
                .build());

        // ── Patient user account ─────────────────────────────────────────────
        User patientUser = userRepo.save(User.builder()
                .name("Malika Yusupova").role(User.Role.patient)
                .phoneNumber("998901234567")
                .build());

        // ── Patient record #1042 ─────────────────────────────────────────────
        Patient patient = patientRepo.save(Patient.builder()
                .user(patientUser)
                .name("Malika Yusupova")
                .phoneNumber("998901234567")
                .pregnancyWeek(28)
                .district("Yunusabad")
                .build());

        // Assign doctor
        patient.getAssignedDoctors().add(doctor);
        patientRepo.save(patient);

        // Additional patients for other districts
        Patient p2 = patientRepo.save(Patient.builder()
                .name("Zulfiya Karimova").phoneNumber("998911112233")
                .pregnancyWeek(32).district("Chilonzor").build());
        p2.getAssignedDoctors().add(doctor);
        patientRepo.save(p2);

        Patient p3 = patientRepo.save(Patient.builder()
                .name("Dilorom Nazarova").phoneNumber("998922223344")
                .pregnancyWeek(20).district("Mirzo Ulugbek").build());
        patientRepo.save(p3);

        // ── Readings for patient #1 — trending Low → Moderate → High ─────────
        Instant base = Instant.now().minus(35, ChronoUnit.DAYS);

        // Week 1 — Normal (Low risk)
        Reading r1 = readingRepo.save(Reading.builder().patient(patient)
                .bloodPressure("110/70").heartRate(72).symptoms("No complaints")
                .source(Reading.Source.nurse).recordedAt(base).build());

        Reading r2 = readingRepo.save(Reading.builder().patient(patient)
                .bloodPressure("112/72").heartRate(74).symptoms("Slight fatigue")
                .source(Reading.Source.nurse).recordedAt(base.plus(7, ChronoUnit.DAYS)).build());

        // Week 2 — Mild elevation (Moderate risk)
        Reading r3 = readingRepo.save(Reading.builder().patient(patient)
                .bloodPressure("128/84").heartRate(82).symptoms("Headache, mild swelling in feet")
                .source(Reading.Source.nurse).recordedAt(base.plus(14, ChronoUnit.DAYS)).build());

        Reading r4 = readingRepo.save(Reading.builder().patient(patient)
                .bloodPressure("132/86").heartRate(86).symptoms("Persistent headache, dizziness")
                .source(Reading.Source.patient).recordedAt(base.plus(21, ChronoUnit.DAYS)).build());

        // Week 3 — Concerning elevation (High risk)
        Reading r5 = readingRepo.save(Reading.builder().patient(patient)
                .bloodPressure("148/96").heartRate(94).symptoms("Severe headache, blurred vision, upper abdominal pain")
                .source(Reading.Source.nurse).recordedAt(base.plus(28, ChronoUnit.DAYS)).build());

        Reading r6 = readingRepo.save(Reading.builder().patient(patient)
                .bloodPressure("155/100").heartRate(98).symptoms("Very severe headache, visual disturbances, nausea")
                .source(Reading.Source.nurse).recordedAt(base.plus(35, ChronoUnit.DAYS)).build());

        // ── Risk scores corresponding to readings ────────────────────────────
        RiskScore rs1 = riskScoreRepo.save(RiskScore.builder().patient(patient)
                .riskLevel(RiskScore.RiskLevel.Low).trend(RiskScore.Trend.stable)
                .keyFactors(List.of("BP within normal range", "Heart rate normal"))
                .calculatedAt(r1.getRecordedAt()).build());

        riskScoreRepo.save(RiskScore.builder().patient(patient)
                .riskLevel(RiskScore.RiskLevel.Low).trend(RiskScore.Trend.stable)
                .keyFactors(List.of("BP within normal range", "Mild fatigue reported"))
                .calculatedAt(r2.getRecordedAt()).build());

        RiskScore rs3 = riskScoreRepo.save(RiskScore.builder().patient(patient)
                .riskLevel(RiskScore.RiskLevel.Moderate).trend(RiskScore.Trend.increasing)
                .keyFactors(List.of("BP elevated (128/84)", "Headache reported", "Heart rate rising"))
                .calculatedAt(r3.getRecordedAt()).build());

        riskScoreRepo.save(RiskScore.builder().patient(patient)
                .riskLevel(RiskScore.RiskLevel.Moderate).trend(RiskScore.Trend.increasing)
                .keyFactors(List.of("BP rising (132/86)", "Persistent headache", "Dizziness reported"))
                .calculatedAt(r4.getRecordedAt()).build());

        RiskScore rs5 = riskScoreRepo.save(RiskScore.builder().patient(patient)
                .riskLevel(RiskScore.RiskLevel.High).trend(RiskScore.Trend.increasing)
                .keyFactors(List.of("BP critically elevated (148/96)", "Severe headache", "Visual symptoms — possible pre-eclampsia"))
                .calculatedAt(r5.getRecordedAt()).build());

        RiskScore rs6 = riskScoreRepo.save(RiskScore.builder().patient(patient)
                .riskLevel(RiskScore.RiskLevel.Critical).trend(RiskScore.Trend.increasing)
                .keyFactors(List.of("BP dangerously high (155/100)", "Severe neurological symptoms", "Multiple warning signs for pre-eclampsia/eclampsia", "Immediate medical attention required"))
                .calculatedAt(r6.getRecordedAt()).build());

        // ── Alerts ───────────────────────────────────────────────────────────
        alertRepo.save(Alert.builder().patient(patient).riskScore(rs3)
                .priority(Alert.Priority.Moderate).status(Alert.AlertStatus.Reviewed)
                .createdAt(r3.getRecordedAt()).updatedAt(r3.getRecordedAt()).build());

        alertRepo.save(Alert.builder().patient(patient).riskScore(rs5)
                .priority(Alert.Priority.High).status(Alert.AlertStatus.FollowUpScheduled)
                .createdAt(r5.getRecordedAt()).updatedAt(r5.getRecordedAt()).build());

        alertRepo.save(Alert.builder().patient(patient).riskScore(rs6)
                .priority(Alert.Priority.Critical).status(Alert.AlertStatus.Alert)
                .needsAiReview(true)
                .createdAt(r6.getRecordedAt()).updatedAt(r6.getRecordedAt()).build());

        // ── Activity log ─────────────────────────────────────────────────────
        activityLogRepo.save(ActivityLog.builder().patient(patient)
                .type(ActivityLog.ActivityType.login).detail("Patient self-registered via phone")
                .occurredAt(base.minus(1, ChronoUnit.DAYS)).build());

        activityLogRepo.save(ActivityLog.builder().patient(patient)
                .type(ActivityLog.ActivityType.reading).detail("Nurse recorded vitals: BP 110/70, HR 72")
                .occurredAt(r1.getRecordedAt()).build());

        activityLogRepo.save(ActivityLog.builder().patient(patient)
                .type(ActivityLog.ActivityType.reading).detail("Nurse recorded vitals: BP 128/84, HR 82")
                .occurredAt(r3.getRecordedAt()).build());

        activityLogRepo.save(ActivityLog.builder().patient(patient)
                .type(ActivityLog.ActivityType.checkin).detail("Patient self-reported: persistent headache, dizziness")
                .occurredAt(r4.getRecordedAt()).build());

        activityLogRepo.save(ActivityLog.builder().patient(patient)
                .type(ActivityLog.ActivityType.alert_viewed).detail("Doctor reviewed Moderate alert")
                .occurredAt(r3.getRecordedAt().plus(2, ChronoUnit.HOURS)).build());

        activityLogRepo.save(ActivityLog.builder().patient(patient)
                .type(ActivityLog.ActivityType.reading).detail("Nurse recorded vitals: BP 155/100, HR 98 — Critical alert raised")
                .occurredAt(r6.getRecordedAt()).build());

        log.info("Demo data seeded. Patient ID: {}, phone: 998901234567", patient.getId());
        log.info("Staff logins — nurse1/doctor1/admin1 all use password: demo1234");
    }
}
