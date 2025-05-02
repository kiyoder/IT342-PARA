package com.it342.para.dto;

import lombok.Data;
import java.time.OffsetDateTime;

@Data
public class SavedRouteResponse {
    private Long id;
    private String relationId;
    private Double initialLat;
    private Double initialLon;
    private Double finalLat;
    private Double finalLon;
    private OffsetDateTime createdAt;
}
