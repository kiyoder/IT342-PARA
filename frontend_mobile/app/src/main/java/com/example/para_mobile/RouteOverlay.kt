package com.example.para_mobile

import android.graphics.Color
import android.graphics.DashPathEffect
import android.graphics.Paint
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Polyline

class RouteOverlay(private val mapView: MapView) {
    private var routeLine: Polyline? = null
    private var outlineLine: Polyline? = null

    fun drawRoute(points: List<GeoPoint>) {
        // Clear existing route if any
        clearRoute()

        // Create outline effect (slightly wider black line underneath)
        outlineLine = Polyline().apply {
            setPoints(points)
            outlinePaint.color = Color.BLACK
            outlinePaint.strokeWidth = 14f
            outlinePaint.isAntiAlias = true
            outlinePaint.alpha = 160
            outlinePaint.strokeCap = Paint.Cap.ROUND
            outlinePaint.strokeJoin = Paint.Join.ROUND
        }

        // Create main route line with requested color
        routeLine = Polyline().apply {
            setPoints(points)
            outlinePaint.color = Color.parseColor("#FF3B10") // Bright red/orange as requested
            outlinePaint.strokeWidth = 10f
            outlinePaint.isAntiAlias = true
            outlinePaint.alpha = 255 // Fully opaque for better visibility
            outlinePaint.strokeCap = Paint.Cap.ROUND
            outlinePaint.strokeJoin = Paint.Join.ROUND

            // Optional: Add a dash pattern for even more visibility
            // Uncomment the line below if you want a dashed line
            // outlinePaint.pathEffect = DashPathEffect(floatArrayOf(20f, 10f), 0f)
        }

        // Add to map in correct order (outline first, then main line)
        outlineLine?.let { mapView.overlays.add(it) }
        routeLine?.let { mapView.overlays.add(it) }

        // Refresh the map
        mapView.invalidate()
    }

    fun clearRoute() {
        outlineLine?.let {
            mapView.overlays.remove(it)
        }
        routeLine?.let {
            mapView.overlays.remove(it)
        }
        outlineLine = null
        routeLine = null
        mapView.invalidate()
    }
}