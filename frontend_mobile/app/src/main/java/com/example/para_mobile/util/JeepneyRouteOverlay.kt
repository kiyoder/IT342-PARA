package com.example.para_mobile.util

import android.graphics.Color
import android.graphics.Paint
import android.util.Log
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Polyline

class JeepneyRouteOverlay(private val mapView: MapView) {
    private var routeLine: Polyline? = null
    private val TAG = "JeepneyRouteOverlay"

    /**
     * Draw a jeepney route on the map
     */
    fun drawRoute(points: List<GeoPoint>, color: String) {
        Log.d(TAG, "Drawing jeepney route with ${points.size} points")

        if (points.size < 2) {
            Log.w(TAG, "Insufficient points to draw a route")
            return
        }

        clearRoute()

        try {
            // Parse the color
            val routeColor = Color.parseColor(color)

            // Create the route line
            routeLine = Polyline().apply {
                setPoints(points)
                outlinePaint.color = routeColor
                outlinePaint.strokeWidth = 10f
                outlinePaint.isAntiAlias = true
                outlinePaint.alpha = 255
                outlinePaint.strokeCap = Paint.Cap.ROUND
                outlinePaint.strokeJoin = Paint.Join.ROUND
            }

            // Add to map
            routeLine?.let { mapView.overlays.add(it) }

            // Fit the map to show the route
            val tempLine = Polyline().apply { setPoints(points) }
            val boundingBox = tempLine.bounds
            mapView.zoomToBoundingBox(boundingBox, true, 100, 18.0, 1)

            mapView.invalidate()
        } catch (e: Exception) {
            Log.e(TAG, "Error drawing jeepney route", e)
        }
    }

    /**
     * Draw a jeepney route on the map (MultiLineString support)
     */
    fun drawRouteSegments(segments: List<List<GeoPoint>>, color: String) {
        Log.d(TAG, "Drawing jeepney route with ${segments.size} segments")
        clearRoute()
        try {
            val routeColor = Color.parseColor(color)
            segments.forEach { points ->
                if (points.size < 2) return@forEach
                val polyline = Polyline().apply {
                    setPoints(points)
                    outlinePaint.color = routeColor
                    outlinePaint.strokeWidth = 10f
                    outlinePaint.isAntiAlias = true
                    outlinePaint.alpha = 255
                    outlinePaint.strokeCap = Paint.Cap.ROUND
                    outlinePaint.strokeJoin = Paint.Join.ROUND
                }
                mapView.overlays.add(polyline)
            }
            mapView.invalidate()
        } catch (e: Exception) {
            Log.e(TAG, "Error drawing jeepney route segments", e)
        }
    }

    /**
     * Clear the route from the map
     */
    fun clearRoute() {
        routeLine?.let {
            mapView.overlays.remove(it)
        }

        routeLine = null
        mapView.invalidate()
    }
}