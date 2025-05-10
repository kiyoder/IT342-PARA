package com.it342.para.dto;

import lombok.Data;
import lombok.AllArgsConstructor;
import lombok.NoArgsConstructor;

@Data
@AllArgsConstructor
@NoArgsConstructor
public class JeepneyRouteDTO {
    private Long id;
    private String routeNumber;
    private String relationId;
    private String locations;
}