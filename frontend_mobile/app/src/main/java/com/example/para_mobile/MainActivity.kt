package com.example.para_mobile

import android.Manifest
import android.annotation.SuppressLint
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.view.MotionEvent
import android.widget.Button
import android.widget.LinearLayout
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import com.google.android.material.bottomsheet.BottomSheetBehavior
import org.osmdroid.config.Configuration
import org.osmdroid.tileprovider.tilesource.TileSourceFactory
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import com.example.para_mobile.CustomLocationOverlay
import retrofit2.*
import retrofit2.converter.gson.GsonConverterFactory
import java.io.File
import android.view.View
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.ImageButton
import android.widget.ImageView
import org.osmdroid.views.overlay.mylocation.GpsMyLocationProvider

class MainActivity : AppCompatActivity() {

    private lateinit var mapView: MapView
    private lateinit var customLocationOverlay: CustomLocationOverlay
    private lateinit var fusedLocationClient: FusedLocationProviderClient
    private lateinit var bottomSheetBehavior: BottomSheetBehavior<View>
    private lateinit var searchEditText: EditText
    private lateinit var routeOverlay: RouteOverlay

    private val retrofit = Retrofit.Builder()
        .baseUrl("https://nominatim.openstreetmap.org/")
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val api = retrofit.create(NominatimAPI::class.java)

    // Add OSRM API retrofit instance
    private val osrmRetrofit = Retrofit.Builder()
        .baseUrl("https://router.project-osrm.org/")
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val routingApi = osrmRetrofit.create(OSRMApi::class.java)

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Check if user is logged in
        val token = getSharedPreferences("app_prefs", MODE_PRIVATE).getString("jwt_token", null)
        if (token.isNullOrEmpty()) {
            // Redirect to login if no token is found
            startActivity(Intent(this, LoginActivity::class.java))
            finish()
            return
        }

        // Initialize fusedLocationClient BEFORE using it
        fusedLocationClient = LocationServices.getFusedLocationProviderClient(this)

        // Set up OSMDroid configuration safely
        val ctx = applicationContext
        val config = Configuration.getInstance()
        val basePath = ctx.getExternalFilesDir(null)

        if (basePath != null) {
            config.osmdroidBasePath = basePath
            config.osmdroidTileCache = File(basePath, "tiles")
        }

        config.load(ctx, getSharedPreferences("osmdroid", MODE_PRIVATE))

        setContentView(R.layout.activity_main)

        // Initialize MapView
        mapView = findViewById(R.id.mapView)
        mapView.setTileSource(TileSourceFactory.MAPNIK)
        mapView.setMultiTouchControls(true)

        // Initialize route overlay
        routeOverlay = RouteOverlay(mapView)

        // Request permissions
        requestPermissionsIfNecessary(arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ))

        // Create a location provider (GpsMyLocationProvider)
        val locationProvider = GpsMyLocationProvider(this)

        // Initialize custom location overlay
        customLocationOverlay = CustomLocationOverlay(this, mapView, locationProvider)  // Pass locationProvider
        mapView.overlays.add(customLocationOverlay)
        customLocationOverlay.enableMyLocation()
        customLocationOverlay.startPulseAnimation()

        // Default map center (Cebu City)
        val startPoint = GeoPoint(10.3157, 123.8854)  // Cebu City coordinates
        mapView.controller.setZoom(15.0)
        mapView.controller.setCenter(startPoint)

        // Get and display user location
        getUserLocation()

        // Initialize the bottom sheet
        setupBottomSheet()

        // Setup map click listener to close info windows
        setupMapClickListener()

        val menuButton = findViewById<ImageButton>(R.id.menu_button)
        menuButton.setOnClickListener {
            // Collapse the bottom sheet before navigating to another activity
            bottomSheetBehavior.state = BottomSheetBehavior.STATE_COLLAPSED

            val intent = Intent(this, SettingsActivity::class.java)
            startActivity(intent)
        }
    }

    private fun setupBottomSheet() {
        // Get the bottom sheet view
        val bottomSheet = findViewById<View>(R.id.bottom_sheet)

        // Initialize the bottom sheet behavior
        bottomSheetBehavior = BottomSheetBehavior.from(bottomSheet)

        // Set the initial state (collapsed but visible)
        bottomSheetBehavior.state = BottomSheetBehavior.STATE_COLLAPSED

        // Set up bottom sheet callbacks
        bottomSheetBehavior.addBottomSheetCallback(object : BottomSheetBehavior.BottomSheetCallback() {
            override fun onStateChanged(bottomSheet: View, newState: Int) {
                when (newState) {
                    BottomSheetBehavior.STATE_EXPANDED -> {
                        // Focus on search when expanded
                        searchEditText.requestFocus()
                    }
                    BottomSheetBehavior.STATE_COLLAPSED -> {
                        // Handle collapsed state if needed
                    }
                    BottomSheetBehavior.STATE_HIDDEN -> {
                        // Handle hidden state if needed
                    }
                }
            }

            override fun onSlide(bottomSheet: View, slideOffset: Float) {
                // Handle sliding behavior if needed
            }
        })

        // Initialize search EditText
        searchEditText = findViewById(R.id.search_edit_text)

        // Set up search action listener
        searchEditText.setOnEditorActionListener { textView, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_SEARCH) {
                val query = textView.text.toString().trim()
                if (query.isNotEmpty()) {
                    searchLocation(query)
                    return@setOnEditorActionListener true
                } else {
                    Toast.makeText(this, "Please enter a location to search", Toast.LENGTH_SHORT).show()
                }
            }
            false
        }

        // Set up voice search button
        val voiceSearchButton = findViewById<ImageView>(R.id.voice_search_button)
        voiceSearchButton.setOnClickListener {
            // Implement voice search functionality
            Toast.makeText(this, "Voice search not implemented", Toast.LENGTH_SHORT).show()
        }

        // Set up click listeners for bottom sheet elements
        setupBottomSheetClickListeners()
    }

    private fun setupBottomSheetClickListeners() {
        // Home location button
        val homeLocation = findViewById<LinearLayout>(R.id.home_location)
        homeLocation?.setOnClickListener {
            // Handle home location click
            Toast.makeText(this, "Navigate to home", Toast.LENGTH_SHORT).show()
            // You could add code to navigate to a saved home location
        }

        // Work location button
        val workLocation = findViewById<LinearLayout>(R.id.work_location)
        workLocation?.setOnClickListener {
            // Handle work location click
            Toast.makeText(this, "Navigate to work", Toast.LENGTH_SHORT).show()
            // You could add code to navigate to a saved work location
        }

        // Add location button
        val addLocation = findViewById<LinearLayout>(R.id.add_location)
        addLocation?.setOnClickListener {
            // Handle add location click
            Toast.makeText(this, "Add new favorite location", Toast.LENGTH_SHORT).show()
            // You could add code to add the current location as a favorite
        }

        // Recent location item
        val recentLocation = findViewById<LinearLayout>(R.id.recent_location_item)
        recentLocation?.setOnClickListener {
            // Handle recent location click
            val locationName = findViewById<TextView>(R.id.recent_location_name)?.text.toString()
            Toast.makeText(this, "Navigate to $locationName", Toast.LENGTH_SHORT).show()
            // Search for this location
            searchLocation(locationName)
        }

        // Mark my location button
        val markLocationButton = findViewById<Button>(R.id.mark_location_button)
        markLocationButton?.setOnClickListener {
            // Handle mark location click
            getUserLocation()
            Toast.makeText(this, "Marked your current location", Toast.LENGTH_SHORT).show()
        }

        // Report issue button
        val reportIssueButton = findViewById<Button>(R.id.report_issue_button)
        reportIssueButton?.setOnClickListener {
            // Handle report issue click
            Toast.makeText(this, "Report an issue", Toast.LENGTH_SHORT).show()
            // You could open a form to report an issue
        }

        // Add a clear route button if you have one in your layout
        val clearRouteButton = findViewById<Button>(R.id.clear_route_button)
        clearRouteButton?.setOnClickListener {
            clearRoute()
            Toast.makeText(this, "Route cleared", Toast.LENGTH_SHORT).show()
        }
    }

    private fun requestPermissionsIfNecessary(permissions: Array<String>) {
        val permissionsToRequest = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsToRequest.toTypedArray(), 1)
        }
    }

    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 1) {
            if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                customLocationOverlay.enableMyLocation()
                getUserLocation()
            }
        }
    }

    private fun getUserLocation() {
        if (ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
            fusedLocationClient.getCurrentLocation(
                com.google.android.gms.location.Priority.PRIORITY_HIGH_ACCURACY,
                null
            ).addOnSuccessListener { location ->
                location?.let {
                    val userGeoPoint = GeoPoint(it.latitude, it.longitude)
                    addMarker(userGeoPoint, "Your Location")
                    mapView.controller.setCenter(userGeoPoint)
                }
            }
        }
    }

    // Existing method to add a marker
    private fun addMarker(geoPoint: GeoPoint, title: String) {
        // Remove all previous markers before adding a new one (except overlays like customLocationOverlay or routeOverlay)
        mapView.overlays.removeAll { it is Marker }

        val marker = Marker(mapView).apply {
            position = geoPoint
            this.title = title
            setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
            icon = ContextCompat.getDrawable(this@MainActivity, R.drawable.ic_custom_marker)

            setOnMarkerClickListener { m, _ ->
                if (m.isInfoWindowShown) {
                    m.closeInfoWindow()
                } else {
                    m.showInfoWindow()
                }
                true
            }
        }

        mapView.overlays.add(marker)
        bounceMarker(marker)
        mapView.invalidate()
    }


    // Add this method to close info window when map is clicked
    @SuppressLint("ClickableViewAccessibility")
    private fun setupMapClickListener() {
        mapView.setOnTouchListener { _, event ->
            // Check if the touch event is a map click (ACTION_DOWN)
            if (event.action == MotionEvent.ACTION_DOWN) {
                // Iterate through all markers and close their info windows if shown
                mapView.overlays.filterIsInstance<Marker>().forEach { marker ->
                    marker.takeIf { it.isInfoWindowShown }?.closeInfoWindow()
                }
            }
            // Return false to allow the map to process the touch event as well
            false
        }
    }

    // custom marker with bounce effect
    private fun bounceMarker(marker: Marker) {
        val handler = android.os.Handler()
        val start = System.currentTimeMillis()
        val duration = 1000L

        val startLat = marker.position.latitude
        val startLon = marker.position.longitude
        val offset = 0.0005

        val bounceRunnable = object : Runnable {
            override fun run() {
                val elapsed = System.currentTimeMillis() - start
                val t = elapsed.toFloat() / duration
                if (t < 1f) {
                    val bounce = Math.sin(t * Math.PI).toFloat() * offset
                    marker.position = GeoPoint(startLat + bounce, startLon)
                    mapView.invalidate()
                    handler.postDelayed(this, 16)
                } else {
                    marker.position = GeoPoint(startLat, startLon)
                    mapView.invalidate()
                }
            }
        }
        handler.post(bounceRunnable)
    }

    // Updated searchLocation method to calculate and display route
    private fun searchLocation(query: String) {
        api.searchLocation(query).enqueue(object : Callback<List<LocationResult>> {
            override fun onResponse(call: Call<List<LocationResult>>, response: Response<List<LocationResult>>) {
                response.body()?.let { results ->
                    if (results.isNotEmpty()) {
                        val location = results[0]
                        val lat = location.lat.toDouble()
                        val lon = location.lon.toDouble()
                        val destinationPoint = GeoPoint(lat, lon)

                        // Move to the location and add marker
                        moveToLocation(lat, lon)
                        addMarker(destinationPoint, location.display_name)

                        // Get current location and calculate route
                        if (ContextCompat.checkSelfPermission(this@MainActivity,
                                Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED) {
                            fusedLocationClient.getLastLocation().addOnSuccessListener { location ->
                                location?.let {
                                    val currentPoint = GeoPoint(it.latitude, it.longitude)
                                    // Calculate and display route
                                    getAndDisplayRoute(currentPoint, destinationPoint)
                                }
                            }
                        }

                        // Collapse the bottom sheet after successful search
                        bottomSheetBehavior.state = BottomSheetBehavior.STATE_COLLAPSED
                    } else {
                        Toast.makeText(this@MainActivity, "No results found", Toast.LENGTH_SHORT).show()
                    }
                }
            }

            override fun onFailure(call: Call<List<LocationResult>>, t: Throwable) {
                Toast.makeText(this@MainActivity, "Search failed: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    // New method to fetch and display route
    private fun getAndDisplayRoute(startPoint: GeoPoint, endPoint: GeoPoint) {
        // Format coordinates for OSRM API (longitude,latitude format)
        val coordinates = "${startPoint.longitude},${startPoint.latitude};${endPoint.longitude},${endPoint.latitude}"

        // Show loading indicator
        Toast.makeText(this, "Calculating route...", Toast.LENGTH_SHORT).show()

        routingApi.getRoute(coordinates).enqueue(object : Callback<OSRMResponse> {
            override fun onResponse(call: Call<OSRMResponse>, response: Response<OSRMResponse>) {
                if (response.isSuccessful) {
                    response.body()?.let { osrmResponse ->
                        if (osrmResponse.routes.isNotEmpty()) {
                            val route = osrmResponse.routes[0]

                            // Decode the polyline
                            val routePoints = PolylineDecoder.decode(route.geometry)

                            // Draw the route
                            routeOverlay.drawRoute(routePoints)

                            // Optionally display route info
                            val distance = route.distance / 1000 // Convert to km
                            val duration = route.duration / 60 // Convert to minutes
                            Toast.makeText(
                                this@MainActivity,
                                "Distance: ${String.format("%.1f", distance)} km, Duration: ${String.format("%.0f", duration)} min",
                                Toast.LENGTH_LONG
                            ).show()
                        }
                    }
                } else {
                    Toast.makeText(this@MainActivity, "Failed to get route", Toast.LENGTH_SHORT).show()
                }
            }

            override fun onFailure(call: Call<OSRMResponse>, t: Throwable) {
                Toast.makeText(this@MainActivity, "Route calculation failed: ${t.message}", Toast.LENGTH_SHORT).show()
            }
        })
    }

    // New method to clear the route
    private fun clearRoute() {
        routeOverlay.clearRoute()
        val searchEditText = findViewById<EditText>(R.id.search_edit_text)
        searchEditText.setText("")
    }

    //animation for marker with zoom effect
    private fun moveToLocation(lat: Double, lon: Double) {
        val target = GeoPoint(lat, lon)
        val current = mapView.mapCenter as GeoPoint

        val handler = android.os.Handler()
        val start = System.currentTimeMillis()
        val duration = 600L // Duration of the animation (shorter for a faster, more dramatic zoom)

        val startLat = current.latitude
        val startLon = current.longitude
        val deltaLat = target.latitude - startLat
        val deltaLon = target.longitude - startLon

        val startZoom = mapView.zoomLevel
        val targetZoom = 18.0 // Make sure this is a high zoom level for the "super zoom" effect

        // Disable zoom gestures temporarily
        mapView.setMultiTouchControls(false)

        val animate = object : Runnable {
            override fun run() {
                val elapsed = System.currentTimeMillis() - start
                val t = (elapsed / duration.toFloat()).coerceAtMost(1f)
                val lat = startLat + deltaLat * t
                val lon = startLon + deltaLon * t
                val zoom = startZoom + (targetZoom - startZoom) * t

                // Move the map's center
                mapView.controller.setCenter(GeoPoint(lat, lon))

                // Zoom the map with a more noticeable zoom change
                mapView.controller.setZoom(zoom)

                if (t < 1f) {
                    handler.postDelayed(this, 16)
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
    }

    // Method to programmatically expand the bottom sheet
    fun expandBottomSheet() {
        bottomSheetBehavior.state = BottomSheetBehavior.STATE_EXPANDED
    }

    // Method to programmatically collapse the bottom sheet
    fun collapseBottomSheet() {
        bottomSheetBehavior.state = BottomSheetBehavior.STATE_COLLAPSED
    }

    override fun onResume() {
        super.onResume()
        mapView.onResume()
    }

    override fun onPause() {
        super.onPause()
        mapView.onPause()
    }
}