package com.momicare.app.dto;

import com.momicare.app.entity.Reading;
import lombok.Builder;
import lombok.Data;
import java.time.Instant;

@Data @Builder
public class ReadingDto {
    private Long id;
    private String bloodPressure;
    private Integer heartRate;
    private String symptoms;
    private Reading.Source source;
    private Instant recordedAt;
}
