package com.momicare.app.service;

import com.momicare.app.dto.ActivityLogDto;
import com.momicare.app.repository.ActivityLogRepository;
import com.momicare.app.security.AppUserDetails;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ActivityLogService {

    private final ActivityLogRepository activityLogRepo;
    private final AccessControlService acl;

    @Transactional(readOnly = true)
    public List<ActivityLogDto> getActivity(Long patientId, int limit, int offset,
                                             AppUserDetails caller) {
        acl.assertCanAccessPatient(caller, patientId);

        // Convert offset/limit to page number
        int pageSize = limit > 0 ? limit : 20;
        int pageNum  = offset / pageSize;

        Page<?> page = activityLogRepo.findByPatientIdOrderByOccurredAtDesc(
                patientId, PageRequest.of(pageNum, pageSize));

        return activityLogRepo
                .findByPatientIdOrderByOccurredAtDesc(patientId, PageRequest.of(pageNum, pageSize))
                .stream()
                .map(log -> ActivityLogDto.builder()
                        .id(log.getId())
                        .type(log.getType())
                        .detail(log.getDetail())
                        .occurredAt(log.getOccurredAt())
                        .build())
                .collect(Collectors.toList());
    }
}
