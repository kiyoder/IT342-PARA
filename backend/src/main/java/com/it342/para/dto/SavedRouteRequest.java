package com.it342.para.dto;

import lombok.Data;

@Data
public class SavedRouteRequest {
    private String relationId;
    private Double initialLat;
    private Double initialLon;
    private Double finalLat;
    private Double finalLon;
}