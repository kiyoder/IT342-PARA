package com.example.para_mobile.model

import org.osmdroid.util.GeoPoint

data class RouteSearchResult(
    val routeId: String,
    val relationId: String,
    val routeNumber: String,
    val locations: String,
    val distance: Double,
    val routePoints: List<GeoPoint>,
    val routeSegments: List<List<GeoPoint>> = emptyList(),
    val startLocation: String = locations.split(" - ").firstOrNull() ?: "",
    val endLocation: String = locations.split(" - ").lastOrNull() ?: ""
)