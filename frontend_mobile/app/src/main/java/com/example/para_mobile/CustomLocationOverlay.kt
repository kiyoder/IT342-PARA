package com.example.para_mobile

import android.content.Context
import android.graphics.Canvas
import android.graphics.drawable.Drawable
import android.location.Location
import android.view.animation.Animation
import android.view.animation.AnimationUtils
import android.widget.ImageView
import androidx.core.content.ContextCompat
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Overlay
import org.osmdroid.views.overlay.mylocation.IMyLocationProvider
import org.osmdroid.views.overlay.mylocation.MyLocationNewOverlay

class CustomLocationOverlay(
    private val context: Context,
    private val mapView: MapView,
    locationProvider: IMyLocationProvider // Ensure the location provider is required
) : MyLocationNewOverlay(locationProvider, mapView) {

    private var currentLocation: GeoPoint? = null
    private var pulseView: ImageView? = null
    private var dotView: ImageView? = null
    private var pulseAnimation: Animation? = null

    init {
        // Initialize the animation
        pulseAnimation = AnimationUtils.loadAnimation(context, R.anim.pulse_animation)

        // Create the pulse view (this would be for a UI-based pulse animation)
        pulseView = ImageView(context).apply {
            setImageDrawable(ContextCompat.getDrawable(context, R.drawable.orange_circle_pulse))
            visibility = ImageView.INVISIBLE
        }

        // Create the dot view (this would be the center of the custom location)
        dotView = ImageView(context).apply {
            setImageDrawable(ContextCompat.getDrawable(context, R.drawable.orange_dot))
            visibility = ImageView.INVISIBLE
        }

        // You could add these views to a layout or show them dynamically on the map
    }

    override fun onLocationChanged(location: Location?, source: IMyLocationProvider?) {
        super.onLocationChanged(location, source)
        location?.let {
            currentLocation = GeoPoint(it.latitude, it.longitude)
            mapView.postInvalidate() // This will trigger the redraw of the map
        }
    }

    override fun draw(canvas: Canvas, mapView: MapView, shadow: Boolean) {
        if (shadow) return

        // Don't draw the default person icon; instead, we'll draw our custom location indicator
        currentLocation?.let { location ->
            // Convert GeoPoint to screen coordinates
            val point = mapView.projection.toPixels(location, null)

            // Draw the pulse circle (if available)
            val pulseDrawable = ContextCompat.getDrawable(context, R.drawable.orange_circle_pulse)
            pulseDrawable?.let {
                it.setBounds(
                    point.x - it.intrinsicWidth / 2,
                    point.y - it.intrinsicHeight / 2,
                    point.x + it.intrinsicWidth / 2,
                    point.y + it.intrinsicHeight / 2
                )
                it.draw(canvas)
            }

            // Draw the center dot (if available)
            val dotDrawable = ContextCompat.getDrawable(context, R.drawable.orange_dot)
            dotDrawable?.let {
                it.setBounds(
                    point.x - it.intrinsicWidth / 2,
                    point.y - it.intrinsicHeight / 2,
                    point.x + it.intrinsicWidth / 2,
                    point.y + it.intrinsicHeight / 2
                )
                it.draw(canvas)
            }
        }
    }

    // Start the animation (if pulse view is being used for UI animation)
    fun startPulseAnimation() {
        pulseView?.visibility = ImageView.VISIBLE
        pulseView?.startAnimation(pulseAnimation)
    }

    // Stop the animation (if pulse view is being used for UI animation)
    fun stopPulseAnimation() {
        pulseView?.clearAnimation()
        pulseView?.visibility = ImageView.INVISIBLE
    }
}
