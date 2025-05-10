package com.example.para_mobile.activity

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.core.content.ContextCompat
import com.example.para_mobile.R
import com.example.para_mobile.util.CustomInfoWindow
import com.example.para_mobile.util.CustomLocationOverlay
import com.example.para_mobile.util.RouteOverlay
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.mylocation.GpsMyLocationProvider
import java.io.File
import android.view.MotionEvent
import android.view.animation.AccelerateDecelerateInterpolator
import org.osmdroid.views.overlay.infowindow.InfoWindow

class MapManager(private val context: Context, private val mapView: MapView, private val bottomSheetManager: BottomSheetManager) {

    lateinit var customLocationOverlay: CustomLocationOverlay
    lateinit var routeOverlay: RouteOverlay
    private lateinit var customInfoWindow: CustomInfoWindow

    private var destinationMarker: Marker? = null // Reference for destination marker
    private var markers = mutableListOf<Marker>() // List to keep track of all markers

    private val defaultLocation = GeoPoint(10.3157, 123.8854)  // Cebu City coordinates
    private val defaultZoomLevel = 15.0
    private val TAG = "MapManager"

    init {
        initializeMap()
    }

    private fun initializeMap() {
        try {
            // Set up OSMDroid configuration
            val config = Configuration.getInstance()
            val basePath = context.getExternalFilesDir(null)

            if (basePath != null) {
                config.osmdroidBasePath = basePath
                config.osmdroidTileCache = File(basePath, "tiles")
            }

            config.load(context, context.getSharedPreferences("osmdroid", Context.MODE_PRIVATE))

            // Initialize MapView
            mapView.setTileSource(TileSourceFactory.MAPNIK)
            mapView.setMultiTouchControls(true)
            mapView.controller.setZoom(defaultZoomLevel)
            mapView.controller.setCenter(defaultLocation)

            // Initialize custom info window
            customInfoWindow = CustomInfoWindow(mapView, bottomSheetManager)

            // Initialize route overlay
            routeOverlay = RouteOverlay(mapView)

            // Create a location provider
            val locationProvider = GpsMyLocationProvider(context)
            locationProvider.locationUpdateMinTime = 5000 // 5 seconds
            locationProvider.locationUpdateMinDistance = 10f // 10 meters

            // Initialize custom location overlay
            customLocationOverlay = CustomLocationOverlay(context, mapView, locationProvider)
            mapView.overlays.add(customLocationOverlay)
            customLocationOverlay.enableMyLocation()
            customLocationOverlay.startPulseAnimation()

            // Collapse bottom sheet when map is touched
            mapView.setOnTouchListener { _, event ->
                if (event.action == MotionEvent.ACTION_DOWN) {
                    // Close any open info windows
                    closeAllInfoWindows()
                    bottomSheetManager.collapse()
                }
                false // Let map handle the touch event normally
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing map", e)
        }
    }

    fun setDefaultLocation() {
        mapView.controller.setZoom(defaultZoomLevel)
        mapView.controller.setCenter(defaultLocation)
    }

    fun addMarker(geoPoint: GeoPoint, title: String): Marker {
        try {
            // Create a new marker
            val marker = Marker(mapView).apply {
                position = geoPoint
                this.title = title
                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                icon = ContextCompat.getDrawable(context, R.drawable.ic_custom_marker)
                infoWindow = customInfoWindow
                setOnMarkerClickListener { marker, _ ->
                    if (marker.isInfoWindowShown) {
                        marker.closeInfoWindow()
                    } else {
                        closeAllInfoWindows()
                        marker.showInfoWindow()
                        bottomSheetManager.collapse()
                    }
                    true
                }
            }

            // Add the marker to the map
            mapView.overlays.add(marker)
            markers.add(marker)
            mapView.invalidate()

            // Animate the marker
            animateMarker(marker)

            return marker
        } catch (e: Exception) {
            Log.e(TAG, "Error adding marker", e)
            throw e
        }
    }

    private fun closeAllInfoWindows() {
        InfoWindow.closeAllInfoWindowsOn(mapView)
    }

    private fun animateMarker(marker: Marker) {
        val handler = Handler(Looper.getMainLooper())
        val start = System.currentTimeMillis()
        val duration = 500L // Animation duration in milliseconds

        val bounceRunnable = object : Runnable {
            override fun run() {
                val elapsed = System.currentTimeMillis() - start
                val t = (elapsed / duration.toFloat()).coerceAtMost(1f)

                // Simple bounce effect
                val interpolator = AccelerateDecelerateInterpolator()
                val interpolatedTime = interpolator.getInterpolation(t)

                // Calculate bounce height (in pixels)
                val bounceHeight = if (t < 1f) {
                    (1 - Math.abs(2 * interpolatedTime - 1)) * 30
                } else {
                    0.0
                }

                marker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM + bounceHeight.toFloat() / mapView.height)

                if (t < 1f) {
                    handler.postDelayed(this, 16) // ~60fps
                } else {
                    // Reset anchor when animation is done
                    marker.setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                    mapView.invalidate()
                }
            }
        }
        handler.post(bounceRunnable)
    }

    fun moveToLocation(lat: Double, lon: Double) {
        try {
            val target = GeoPoint(lat, lon)
            val current = mapView.mapCenter as GeoPoint

            val handler = Handler(Looper.getMainLooper())
            val start = System.currentTimeMillis()
            val duration = 600L

            val startLat = current.latitude
            val startLon = current.longitude
            val deltaLat = target.latitude - startLat
            val deltaLon = target.longitude - startLon

            val startZoom = mapView.zoomLevelDouble
            val targetZoom = 18.0

            // Disable zoom gestures temporarily
            mapView.setMultiTouchControls(false)

            val animate = object : Runnable {
                override fun run() {
                    val elapsed = System.currentTimeMillis() - start
                    val t = (elapsed / duration.toFloat()).coerceAtMost(1f)

                    // Use an easing function for smoother animation
                    val easedT = easeInOutQuad(t)

                    val lat = startLat + deltaLat * easedT
                    val lon = startLon + deltaLon * easedT
                    val zoom = startZoom + (targetZoom - startZoom) * easedT

                    // Move the map's center
                    mapView.controller.setCenter(GeoPoint(lat, lon))

                    // Zoom the map
                    mapView.controller.setZoom(zoom)

                    if (t < 1f) {
                        handler.postDelayed(this, 16) // ~60fps
                    } else {
                        // Ensure the final target values are applied
                        mapView.controller.setCenter(target)
                        mapView.controller.setZoom(targetZoom)

                        // Re-enable zoom controls after animation is complete
                        mapView.setMultiTouchControls(true)
                    }
                }
            }

            handler.post(animate)
        } catch (e: Exception) {
            Log.e(TAG, "Error moving to location", e)
            // Fallback to instant movement if animation fails
            mapView.controller.setCenter(GeoPoint(lat, lon))
            mapView.controller.setZoom(18.0)
            mapView.setMultiTouchControls(true)
        }
    }

    // Easing function for smoother animations
    private fun easeInOutQuad(t: Float): Float {
        return if (t < 0.5f) 2f * t * t else -1f + (4f - 2f * t) * t
    }

    fun clearRoute(bottomSheetManager: BottomSheetManager) {
        try {
            // Clear the route
            routeOverlay.clearRoute()

            // Remove all markers
            for (marker in markers) {
                mapView.overlays.remove(marker)
            }
            markers.clear()
            destinationMarker = null

            // Reset the map to the user's current location or default location
            val currentLocation = customLocationOverlay.myLocation
            if (currentLocation != null) {
                mapView.controller.setZoom(18.0)
                mapView.controller.setCenter(currentLocation)
            } else {
                setDefaultLocation()
            }

            // Refresh the map
            mapView.invalidate()

            // Collapse the bottom sheet
            bottomSheetManager.collapse()
        } catch (e: Exception) {
            Log.e(TAG, "Error clearing route", e)
        }
    }

    fun zoomToShowMarkers() {
        try {
            if (markers.isEmpty()) return

            // Calculate the bounding box that includes all markers
            var north = -90.0
            var south = 90.0
            var east = -180.0
            var west = 180.0

            for (marker in markers) {
                val position = marker.position
                north = Math.max(north, position.latitude)
                south = Math.min(south, position.latitude)
                east = Math.max(east, position.longitude)
                west = Math.min(west, position.longitude)
            }

            // Add some padding
            val latPadding = (north - south) * 0.1
            val lonPadding = (east - west) * 0.1

            val boundingBox = org.osmdroid.util.BoundingBox(
                north + latPadding,
                east + lonPadding,
                south - latPadding,
                west - lonPadding
            )

            // Animate to the bounding box
            mapView.zoomToBoundingBox(boundingBox, true, 100)
        } catch (e: Exception) {
            Log.e(TAG, "Error zooming to markers", e)
        }
    }

    fun zoomToShowMarkersWithBottomPadding(bottomPaddingPercent: Double = 0.3) {
        if (markers.size < 2) return
        // Calculate bounding box
        var north = -90.0
        var south = 90.0
        var east = -180.0
        var west = 180.0
        for (marker in markers) {
            val pos = marker.position
            north = maxOf(north, pos.latitude)
            south = minOf(south, pos.latitude)
            east = maxOf(east, pos.longitude)
            west = minOf(west, pos.longitude)
        }
        val latPadding = (north - south) * 0.1
        val lonPadding = (east - west) * 0.1
        val boundingBox = org.osmdroid.util.BoundingBox(
            north + latPadding,
            east + lonPadding,
            south - latPadding,
            west - lonPadding
        )
        // Animate to bounding box
        mapView.zoomToBoundingBox(boundingBox, true, 100)
        // Scroll map up to account for bottom sheet
        val height = mapView.height
        val yOffset = (height * bottomPaddingPercent).toInt()
        mapView.scrollBy(0, yOffset)
    }

    fun removeAllMarkers() {
        try {
            for (marker in markers) {
                mapView.overlays.remove(marker)
            }
            markers.clear()
            mapView.invalidate()
        } catch (e: Exception) {
            Log.e(TAG, "Error removing markers", e)
        }
    }
}
