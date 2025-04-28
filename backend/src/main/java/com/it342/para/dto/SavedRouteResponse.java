package com.it342.para.dto;

import java.time.LocalDateTime;

public class SavedRouteResponse {
    private Long id;
    private String relationId;
    private Double initialLat;
    private Double initialLon;
    private Double finalLat;
    private Double finalLon;
    private LocalDateTime createdAt;

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public String getRelationId() {
        return relationId;
    }

    public void setRelationId(String relationId) {
        this.relationId = relationId;
    }

    public Double getInitialLat() {
        return initialLat;
    }

    public void setInitialLat(Double initialLat) {
        this.initialLat = initialLat;
    }

    public Double getInitialLon() {
        return initialLon;
    }

    public void setInitialLon(Double initialLon) {
        this.initialLon = initialLon;
    }

    public Double getFinalLat() {
        return finalLat;
    }

    public void setFinalLat(Double finalLat) {
        this.finalLat = finalLat;
    }

    public Double getFinalLon() {
        return finalLon;
    }

    public void setFinalLon(Double finalLon) {
        this.finalLon = finalLon;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
