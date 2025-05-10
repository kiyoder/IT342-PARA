package com.example.para_mobile.util

import android.animation.ValueAnimator
import android.content.Context
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.Paint
import android.location.Location
import android.view.animation.LinearInterpolator
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.mylocation.IMyLocationProvider
import org.osmdroid.views.overlay.mylocation.MyLocationNewOverlay

class CustomLocationOverlay(
    private val context: Context,
    private val mapView: MapView,
    locationProvider: IMyLocationProvider
) : MyLocationNewOverlay(locationProvider, mapView) {

    private var currentLocation: GeoPoint? = null
    private var pulseRadius = 0f
    private var pulseAlpha = 100
    private var isPulsing = false

    // Paint for pulsing effect
    private val pulsePaint = Paint().apply {
        color = Color.argb(pulseAlpha, 255, 59, 16) // translucent pulse, base: #FF3B10
        style = Paint.Style.FILL
        isAntiAlias = true
    }

    // Paint for the center dot
    private val dotPaint = Paint().apply {
        color = Color.parseColor("#FF3B10") // solid #FF3B10
        style = Paint.Style.FILL
        isAntiAlias = true
    }

    override fun onLocationChanged(location: Location?, source: IMyLocationProvider?) {
        super.onLocationChanged(location, source)
        location?.let {
            currentLocation = GeoPoint(it.latitude, it.longitude)
            mapView.postInvalidate() // Trigger redraw
        }
    }

    override fun draw(canvas: Canvas, mapView: MapView, shadow: Boolean) {
        // Skip shadow layer and default person/marker drawing
        if (shadow) return

        currentLocation?.let { location ->
            val point = mapView.projection.toPixels(location, null)

            // Draw pulsing circle
            pulsePaint.alpha = pulseAlpha
            canvas.drawCircle(point.x.toFloat(), point.y.toFloat(), pulseRadius, pulsePaint)

            // Draw center dot
            canvas.drawCircle(point.x.toFloat(), point.y.toFloat(), 18f, dotPaint) // slightly bigger dot
        }
    }

    fun startPulseAnimation() {
        if (isPulsing) return
        isPulsing = true

        val animator = ValueAnimator.ofFloat(0f, 120f) // Bigger pulse range
        animator.duration = 1500
        animator.repeatCount = ValueAnimator.INFINITE
        animator.interpolator = LinearInterpolator()

        animator.addUpdateListener { animation ->
            pulseRadius = animation.animatedValue as Float
            pulseAlpha = (80 * (1 - pulseRadius / 120f)).toInt() // fade out as it grows
            mapView.postInvalidate()
        }

        animator.start()
    }


}
