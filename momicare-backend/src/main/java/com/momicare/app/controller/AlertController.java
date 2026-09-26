package com.momicare.app.controller;

import com.momicare.app.dto.AlertDto;
import com.momicare.app.dto.UpdateAlertRequest;
import com.momicare.app.security.AppUserDetails;
import com.momicare.app.service.AlertService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
public class AlertController {

    private final AlertService alertService;

    /**
     * GET /api/alerts
     * Role-scoped: admin sees all; doctor sees assigned patients only.
     * Sorted Critical→High→Moderate→Low. Low alerts grouped into digest.
     * nurse/patient → 403.
     */
    @GetMapping
    public ResponseEntity<List<AlertDto>> getAlerts(
            @AuthenticationPrincipal AppUserDetails caller) {
        return ResponseEntity.ok(alertService.getAlerts(caller));
    }

    /**
     * PATCH /api/alerts/{id}
     * Update alert status: Reviewed | FollowUpScheduled | Resolved.
     * doctor/admin only.
     */
    @PatchMapping("/{id}")
    public ResponseEntity<AlertDto> updateAlert(
            @PathVariable Long id,
            @Valid @RequestBody UpdateAlertRequest req,
            @AuthenticationPrincipal AppUserDetails caller) {
        return ResponseEntity.ok(alertService.updateAlert(id, req, caller));
    }
}
