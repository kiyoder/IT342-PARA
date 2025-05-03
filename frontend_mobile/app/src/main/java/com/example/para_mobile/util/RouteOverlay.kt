package com.example.para_mobile.util

import android.graphics.Color
import android.graphics.Paint
import android.util.Log
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Polyline

class RouteOverlay(private val mapView: MapView) {
    private var routeLine: Polyline? = null
    private var outlineLine: Polyline? = null
    private var originalLine: Polyline? = null

    fun drawRoute(points: List<GeoPoint>) {
        Log.d("RouteOverlay", "Drawing route with ${points.size} points")

        if (points.size < 2) {
            Log.w("RouteOverlay", "Insufficient points to draw a route")
            return
        }

        clearRoute()

        // Outline line (black background)
        outlineLine = Polyline().apply {
            setPoints(points)
            outlinePaint.color = Color.BLACK
            outlinePaint.strokeWidth = 14f
            outlinePaint.isAntiAlias = true
            outlinePaint.alpha = 160
            outlinePaint.strokeCap = Paint.Cap.ROUND
            outlinePaint.strokeJoin = Paint.Join.ROUND
        }

        // Main route line (colored foreground)
        routeLine = Polyline().apply {
            setPoints(points)
            outlinePaint.color = Color.parseColor("#FF3B10")
            outlinePaint.strokeWidth = 10f
            outlinePaint.isAntiAlias = true
            outlinePaint.alpha = 255
            outlinePaint.strokeCap = Paint.Cap.ROUND
            outlinePaint.strokeJoin = Paint.Join.ROUND
        }

        // Add overlays
        outlineLine?.let { mapView.overlays.add(it) }
        routeLine?.let { mapView.overlays.add(it) }

        mapView.invalidate()
    }

    fun drawOriginalLine(points: List<GeoPoint>) {
        Log.d("RouteOverlay", "Drawing original line with ${points.size} points")

        clearOriginalLine()

        originalLine = Polyline().apply {
            setPoints(points)
            outlinePaint.color = Color.parseColor("#3366CC")
            outlinePaint.strokeWidth = 6f
            outlinePaint.isAntiAlias = true
            outlinePaint.alpha = 200
            outlinePaint.strokeCap = Paint.Cap.ROUND
            outlinePaint.strokeJoin = Paint.Join.ROUND

            // Dash pattern
            val dashPattern = floatArrayOf(10f, 10f)
            outlinePaint.pathEffect = android.graphics.DashPathEffect(dashPattern, 0f)
        }

        originalLine?.let { mapView.overlays.add(it) }
        mapView.invalidate()
    }

    fun drawTestLine() {
        val testPoints = listOf(
            GeoPoint(10.3157, 123.8854), // Cebu
            GeoPoint(10.3093, 123.8935)  // Another Cebu point
        )
        Log.d("RouteOverlay", "Drawing test line")
        drawRoute(testPoints)
    }

    private fun clearOriginalLine() {
        originalLine?.let {
            mapView.overlays.remove(it)
        }
        originalLine = null
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

        clearOriginalLine()

        mapView.invalidate()
    }
}
