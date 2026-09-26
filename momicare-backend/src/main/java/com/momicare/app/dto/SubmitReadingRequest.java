package com.momicare.app.dto;

import com.momicare.app.entity.Reading;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class SubmitReadingRequest {
    /** Format "systolic/diastolic", e.g. "120/80" */
    private String bloodPressure;
    private Integer heartRate;
    private String symptoms;

    @NotNull
    private Reading.Source source;
}
