package com.it342.para.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "saved_routes")
public class SavedRoute {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(name = "relation_id", nullable = false, length = 20)
    private String relationId;

    @Column(name = "initial_lat", nullable = false)
    private Double initialLat;

    @Column(name = "initial_lon", nullable = false)
    private Double initialLon;

    @Column(name = "final_lat", nullable = false)
    private Double finalLat;

    @Column(name = "final_lon", nullable = false)
    private Double finalLon;

    @Column(name = "created_at")
    private LocalDateTime createdAt = LocalDateTime.now();

    // Getters and setters
    public Long getId() {
        return id;
    }

    public void setId(Long id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
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
