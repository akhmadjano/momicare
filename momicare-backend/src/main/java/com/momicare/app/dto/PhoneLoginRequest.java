package com.momicare.app.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class PhoneLoginRequest {
    @NotBlank
    private String phoneNumber;
}
