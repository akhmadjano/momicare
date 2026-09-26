package com.momicare.app.controller;

import com.momicare.app.dto.RegionalSummaryDto;
import com.momicare.app.security.AppUserDetails;
import com.momicare.app.service.RegionalService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/regions")
@RequiredArgsConstructor
public class RegionalController {

    private final RegionalService regionalService;

    /**
     * GET /api/regions/summary
     * Admin only. District-level aggregated risk from anonymised data.
     * No patient IDs or names returned.
     */
    @GetMapping("/summary")
    public ResponseEntity<List<RegionalSummaryDto>> getSummary(
            @AuthenticationPrincipal AppUserDetails caller) {
        return ResponseEntity.ok(regionalService.getSummary(caller));
    }
}
