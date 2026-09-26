package com.momicare.app.controller;

import com.momicare.app.dto.ActivityLogDto;
import com.momicare.app.security.AppUserDetails;
import com.momicare.app.service.ActivityLogService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/patients/{patientId}/activity")
@RequiredArgsConstructor
public class ActivityLogController {

    private final ActivityLogService activityLogService;

    /**
     * GET /api/patients/{id}/activity?limit=20&offset=0
     * Patient: own activity only. Nurse/doctor/admin: unrestricted
     * (doctor still limited to assigned patients via assertCanAccessPatient).
     */
    @GetMapping
    public ResponseEntity<List<ActivityLogDto>> getActivity(
            @PathVariable Long patientId,
            @RequestParam(defaultValue = "20") int limit,
            @RequestParam(defaultValue = "0")  int offset,
            @AuthenticationPrincipal AppUserDetails caller) {
        return ResponseEntity.ok(activityLogService.getActivity(patientId, limit, offset, caller));
    }
}
