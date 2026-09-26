package com.momicare.app.service;

import com.momicare.app.dto.RegionalSummaryDto;
import com.momicare.app.entity.RiskScore;
import com.momicare.app.repository.PatientRepository;
import com.momicare.app.repository.RiskScoreRepository;
import com.momicare.app.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class RegionalService {

    private final PatientRepository patientRepo;
    private final RiskScoreRepository riskScoreRepo;
    private final AccessControlService acl;

    @Transactional(readOnly = true)
    public List<RegionalSummaryDto> getSummary(AppUserDetails caller) {
        acl.assertRole(caller, "admin");

        // Patient count per district
        Map<String, Long> countByDistrict = patientRepo.countByDistrict().stream()
                .collect(Collectors.toMap(
                        row -> (String) row[0],
                        row -> (Long) row[1]
                ));

        // Latest risk level per district (native query returns district, risk_level string)
        Map<String, RiskScore.RiskLevel> riskByDistrict = new HashMap<>();
        for (Object[] row : riskScoreRepo.findLatestRiskLevelByDistrict()) {
            String district = (String) row[0];
            String levelStr = (String) row[1];
            try {
                riskByDistrict.put(district, RiskScore.RiskLevel.valueOf(levelStr));
            } catch (IllegalArgumentException ignored) {}
        }

        return countByDistrict.entrySet().stream()
                .map(e -> RegionalSummaryDto.builder()
                        .district(e.getKey())
                        .patientCount(e.getValue())
                        .dominantRiskLevel(riskByDistrict.getOrDefault(e.getKey(), RiskScore.RiskLevel.Low))
                        .build())
                .sorted(Comparator.comparing(RegionalSummaryDto::getDistrict))
                .collect(Collectors.toList());
    }
}
