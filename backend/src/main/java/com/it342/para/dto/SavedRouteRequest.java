package com.it342.para.dto;

public class SavedRouteRequest {
    private String relationId;
    private Double initialLat;
    private Double initialLon;
    private Double finalLat;
    private Double finalLon;

    // Getters and setters
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
}
