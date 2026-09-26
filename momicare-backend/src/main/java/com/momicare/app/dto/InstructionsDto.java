package com.momicare.app.dto;

import lombok.Builder;
import lombok.Data;
import java.util.List;

/** Returned by GET /api/patients/{id}/instructions */
@Data @Builder
public class InstructionsDto {
    private String headline;
    private List<String> tips;
    private String basedOn;
}
