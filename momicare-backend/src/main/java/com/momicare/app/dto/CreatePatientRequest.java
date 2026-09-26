package com.momicare.app.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class CreatePatientRequest {
    @NotBlank
    private String name;

    private String phoneNumber;
    private Integer pregnancyWeek;
    private String district;

    /** Optional: assign a doctor immediately on creation */
    private Long assignDoctorId;
}
