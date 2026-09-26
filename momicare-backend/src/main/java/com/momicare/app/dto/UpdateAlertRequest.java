package com.momicare.app.dto;

import com.momicare.app.entity.Alert;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class UpdateAlertRequest {
    @NotNull
    private Alert.AlertStatus status;
}
