package com.example.para_mobile.activity

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.ContentValues.TAG
import android.content.Intent
import android.content.SharedPreferences
import android.os.Bundle
import android.view.MotionEvent
import android.view.View
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.appcompat.app.ActionBarDrawerToggle
import androidx.core.app.ActivityCompat
import androidx.core.content.ContextCompat
import com.example.para_mobile.R
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import android.content.pm.PackageManager
import android.location.Location
import android.view.Menu
import android.util.Log
import androidx.drawerlayout.widget.DrawerLayout
import android.view.MenuItem
import androidx.core.view.GravityCompat
import com.example.para_mobile.fragment.AboutFragment
import com.example.para_mobile.fragment.HomeFragment
import com.example.para_mobile.fragment.ProfileFragment
import com.example.para_mobile.fragment.SettingsFragment
import com.example.para_mobile.fragment.ShareFragment
import com.google.android.material.navigation.NavigationView
import androidx.annotation.RequiresPermission
import com.example.para_mobile.util.CustomLocationOverlay
import org.osmdroid.views.overlay.mylocation.IMyLocationConsumer
import org.osmdroid.views.overlay.mylocation.IMyLocationProvider
import com.example.para_mobile.fragment.JeepneyRouteFragment
import com.example.para_mobile.helper.PolylineDecoder
import com.example.para_mobile.service.RouteService
import com.example.para_mobile.util.JeepneyRouteOverlay
import com.example.para_mobile.util.RouteOverlay
import com.google.android.material.floatingactionbutton.FloatingActionButton
import android.widget.EditText
import android.widget.LinearLayout
import com.example.para_mobile.api.RetrofitClient

// Add these imports for coroutines
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext

class MainActivity : AppCompatActivity(), NavigationView.OnNavigationItemSelectedListener, com.example.para_mobile.fragment.SearchAndClearFragment.OnRequestCurrentLocationListener {

    private lateinit var mapView: MapView
    lateinit var mapManager: MapManager
    private lateinit var locationService: LocationService
    lateinit var searchService: SearchService
    lateinit var bottomSheetManager: BottomSheetManager
    private lateinit var drawerLayout: DrawerLayout
    private lateinit var bottomSheet: View
    private lateinit var sharedPrefs: SharedPreferences

    // Add these properties for jeepney route functionality
    private lateinit var jeepneyRouteOverlay: JeepneyRouteOverlay
    private lateinit var routeService: RouteService

    private var pendingLocationCallback: ((GeoPoint) -> Unit)? = null
    private val LOCATION_PERMISSION_REQUEST_CODE = 1001

    private var customLocationOverlay: CustomLocationOverlay? = null

    // Add this property for GoogleAuthHelper
    private lateinit var googleAuthHelper: com.example.para_mobile.util.GoogleAuthHelper

    @RequiresPermission(allOf = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION])
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

        // Ensure token is properly formatted for API calls
        RetrofitClient.setAuthToken(token)




        setContentView(R.layout.activity_main)

        // Initialize SharedPreferences
        sharedPrefs = getSharedPreferences("app_prefs", MODE_PRIVATE)

        // Request permissions
        requestPermissionsIfNecessary(arrayOf(
            Manifest.permission.ACCESS_FINE_LOCATION,
            Manifest.permission.ACCESS_COARSE_LOCATION
        ))

        // Initialize services
        initializeServices()

        // Set up route overlay
        val routeOverlay = RouteOverlay(mapView)

        // Initialize jeepney route overlay and route service
        jeepneyRouteOverlay = JeepneyRouteOverlay(mapView)
        routeService = RouteService(this)

        // Use the included Jeepney Finder card from the layout
        val finderView = findViewById<View>(R.id.jeepneyFinderContainer)
        val jeepneyCodeInput = finderView.findViewById<EditText>(R.id.jeepneyCodeInput)
        val btnSearchJeepney = finderView.findViewById<ImageButton>(R.id.btnSearchJeepney)
        btnSearchJeepney.setOnClickListener {
            val routeNumber = jeepneyCodeInput.text.toString().trim()
            if (routeNumber.isNotEmpty()) {
                testShowJeepneyRouteByNumber(routeNumber)
            } else {
                Toast.makeText(this, "Please enter a jeepney code", Toast.LENGTH_SHORT).show()
            }
        }

        // Get and display user location
        getUserLocation()

        // Setup map click listener to close info windows
        setupMapClickListener()

        drawerLayout = findViewById(R.id.drawer_layout)
        val navigationView = findViewById<NavigationView>(R.id.nav_view)
        navigationView.setNavigationItemSelectedListener(this)

        // Add drawer listener to close bottom sheet when drawer is opened
        drawerLayout.addDrawerListener(object : DrawerLayout.DrawerListener {
            override fun onDrawerSlide(drawerView: View, slideOffset: Float) {}

            override fun onDrawerOpened(drawerView: View) {
                // Close bottom sheet when drawer is opened
                bottomSheetManager.collapse()
            }

            override fun onDrawerClosed(drawerView: View) {}

            override fun onDrawerStateChanged(newState: Int) {}
        })

        if (savedInstanceState == null) {
            supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, HomeFragment()).commit()
            navigationView.setCheckedItem(R.id.nav_home)
        }

        /*val toolbar: androidx.appcompat.widget.Toolbar = findViewById(R.id.toolbar)
        setSupportActionBar(toolbar)*/

        // Enable the hamburger icon
        val toggle = ActionBarDrawerToggle(
            this,
            drawerLayout,
            R.string.navigation_drawer_open,
            R.string.navigation_drawer_close
        )
        drawerLayout.addDrawerListener(toggle)
        toggle.syncState()

        val hamburgerButton = findViewById<ImageButton>(R.id.btnNavAccent)
        hamburgerButton.setOnClickListener {
            drawerLayout.openDrawer(GravityCompat.START)
        }

        // Set up the navigation header with user info
        setupNavHeader()

        // Initialize GoogleAuthHelper
        googleAuthHelper = com.example.para_mobile.util.GoogleAuthHelper(this)
    }

    // Set up the navigation header with user info and profile button
    private fun setupNavHeader() {
        val navigationView = findViewById<NavigationView>(R.id.nav_view)
        val headerView = navigationView.getHeaderView(0)

        // Get user info from SharedPreferences
        val sharedPref = getSharedPreferences("app_prefs", MODE_PRIVATE)
        val username = sharedPref.getString("username", "Username")
        val email = sharedPref.getString("email", "emailaddress")

        // Set the username and email in the header
        val tvUsername = headerView.findViewById<TextView>(R.id.tvUsername)
        val tvEmail = headerView.findViewById<TextView>(R.id.tvEmail)
        tvUsername.text = username
        tvEmail.text = email

        // Set up the profile button click listener
        val btnViewProfile = headerView.findViewById<ImageButton>(R.id.btnViewProfile)
        btnViewProfile.setOnClickListener {
            // Close the drawer
            drawerLayout.closeDrawer(GravityCompat.START)

            // Navigate to profile fragment
            supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, ProfileFragment())
                .addToBackStack(null)
                .commit()
        }
    }

    // Method to update the navigation header with new user info
    fun updateNavHeader(username: String?, email: String?) {
        val navigationView = findViewById<NavigationView>(R.id.nav_view)
        val headerView = navigationView.getHeaderView(0)

        val tvUsername = headerView.findViewById<TextView>(R.id.tvUsername)
        val tvEmail = headerView.findViewById<TextView>(R.id.tvEmail)

        tvUsername.text = username ?: "Username"
        tvEmail.text = email ?: "emailaddress"
    }

    // Override dispatchTouchEvent to handle touches outside the bottom sheet
    override fun dispatchTouchEvent(ev: MotionEvent?): Boolean {
        if (ev?.action == MotionEvent.ACTION_DOWN) {
            // If bottom sheet is expanded and the touch is outside the bottom sheet
            if (bottomSheetManager.getState() == com.google.android.material.bottomsheet.BottomSheetBehavior.STATE_EXPANDED) {
                // Check if the touch is outside the bottom sheet
                if (bottomSheet != null && !isPointInsideView(ev.rawX, ev.rawY, bottomSheet)) {
                    bottomSheetManager.collapse()
                }
            }
        }
        return super.dispatchTouchEvent(ev)
    }

    // Helper method to check if a point is inside a view
    private fun isPointInsideView(x: Float, y: Float, view: View): Boolean {
        val location = IntArray(2)
        view.getLocationOnScreen(location)
        val viewX = location[0]
        val viewY = location[1]

        // Check if the point is within the bounds of the view
        return (x >= viewX && x <= viewX + view.width &&
                y >= viewY && y <= viewY + view.height)
    }

    override fun onNavigationItemSelected(item: MenuItem): Boolean {
        when (item.itemId) {
            R.id.nav_home -> supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, HomeFragment())
                .commit()

            R.id.nav_about -> supportFragmentManager.beginTransaction()
                .replace(R.id.fragment_container, AboutFragment())
                .addToBackStack(null) // Enable back button navigation
                .commit()

            R.id.nav_logout -> {
                showLogoutConfirmationDialog()
            }
        }

        // Close bottom sheet when navigation item is selected
        bottomSheetManager.collapse()

        drawerLayout.closeDrawer(GravityCompat.START)
        return true
    }


    private fun showLogoutConfirmationDialog() {
        AlertDialog.Builder(this)
            .setTitle("Logout")
            .setMessage("Are you sure you want to logout?")
            .setPositiveButton("Yes") { _, _ ->
                // Handle logout logic: Clear all session data from SharedPreferences
                val editor = sharedPrefs.edit()
                editor.remove("jwt_token")
                editor.remove("username")
                editor.remove("email")
                editor.remove("user_id")
                editor.remove("supabase_uid")
                editor.remove("phone")
                editor.remove("routes") // If you store routes as a StringSet
                editor.apply()

                // Clear cache (optional)
                cacheDir.deleteRecursively() // Clears the app's cache

                // Google sign out (if user used Google login)
                googleAuthHelper.signOut {
                    // Optionally log or handle completion
                }

                // Optionally, show a Toast message confirming logout
                Toast.makeText(this, "Logging out...", Toast.LENGTH_SHORT).show()

                // Redirect to the login screen
                val intent = Intent(this, LoginActivity::class.java)
                intent.flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TASK
                startActivity(intent)
                finish() // Ensure the user cannot go back to the Settings screen
            }
            .setNegativeButton("Cancel", null)
            .show()
    }

    override fun onBackPressed() {
        if (drawerLayout.isDrawerOpen(GravityCompat.START)) {
            drawerLayout.closeDrawer(GravityCompat.START)
        } else if (bottomSheetManager.getState() == com.google.android.material.bottomsheet.BottomSheetBehavior.STATE_EXPANDED) {
            // If bottom sheet is expanded, collapse it on back press
            bottomSheetManager.collapse()
        } else {
            super.onBackPressed()
        }
    }

    @SuppressLint("MissingPermission")
    private fun initializeServices() {
        // Initialize MapView
        mapView = findViewById(R.id.mapView)

        // Initialize location and search services
        locationService = LocationService(this)
        searchService = SearchService()

        // Initialize bottom sheet manager FIRST
        bottomSheet = findViewById(R.id.bottom_sheet)
        bottomSheetManager = BottomSheetManager(
            context = this,
            bottomSheet = bottomSheet,
            fragmentManager = supportFragmentManager,
            onSearchQuery = { query -> searchLocation(query) },
            onMarkLocation = @androidx.annotation.RequiresPermission(
                allOf = [android.Manifest.permission.ACCESS_FINE_LOCATION, android.Manifest.permission.ACCESS_COARSE_LOCATION]
            ) { getUserLocation() },
            onClearRoute = {
                mapManager.clearRoute(bottomSheetManager)
                jeepneyRouteOverlay.clearRoute() // Also clear jeepney route
            },
            searchService = searchService
        )

        // Now you can initialize mapManager and pass bottomSheetManager into it
        mapManager = MapManager(this, mapView, bottomSheetManager)

        // Initialize jeepney route overlay and route service
        jeepneyRouteOverlay = JeepneyRouteOverlay(mapView)
        routeService = RouteService(this)

        // Pass the jeepney route overlay to the bottom sheet manager
        bottomSheetManager.setMapView(mapView, mapManager.routeOverlay, jeepneyRouteOverlay)
        // Pass mapManager to bottomSheetManager
        bottomSheetManager.setMapManager(mapManager)
    }

    private fun requestPermissionsIfNecessary(permissions: Array<String>) {
        val permissionsToRequest = permissions.filter {
            ContextCompat.checkSelfPermission(this, it) != PackageManager.PERMISSION_GRANTED
        }
        if (permissionsToRequest.isNotEmpty()) {
            ActivityCompat.requestPermissions(this, permissionsToRequest.toTypedArray(), 1)
        }
    }

    @SuppressLint("MissingPermission")
    override fun onRequestPermissionsResult(requestCode: Int, permissions: Array<out String>, grantResults: IntArray) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults)
        if (requestCode == 1) {
            if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                mapManager.customLocationOverlay.enableMyLocation()
                getUserLocation()
            }
        }
        // Handle location permission request for current location callback
        if (requestCode == LOCATION_PERMISSION_REQUEST_CODE) {
            if (grantResults.isNotEmpty() && grantResults.all { it == PackageManager.PERMISSION_GRANTED }) {
                // Permission granted, retry the pending callback
                pendingLocationCallback?.let { callback ->
                    locationService.getCurrentLocation { geoPoint ->
                        callback(geoPoint)
                    }
                    pendingLocationCallback = null
                }
            } else {
                // Permission denied, show a message or handle as needed
                Toast.makeText(this, "Location permission not granted", Toast.LENGTH_SHORT).show()
                pendingLocationCallback = null
            }
        }
    }

    // Helper function to check location permissions
    private fun hasLocationPermission(): Boolean {
        return ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_FINE_LOCATION) == PackageManager.PERMISSION_GRANTED &&
               ContextCompat.checkSelfPermission(this, Manifest.permission.ACCESS_COARSE_LOCATION) == PackageManager.PERMISSION_GRANTED
    }

    @RequiresPermission(allOf = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION])
    private fun getUserLocation() {
        if (!hasLocationPermission()) {
            Toast.makeText(this, "Location permission not granted", Toast.LENGTH_SHORT).show()
            return
        }
        locationService.getCurrentLocation { geoPoint ->
            geoPoint?.let { location ->
                // Remove previous overlay if present
                if (customLocationOverlay != null) {
                    mapView.overlays.remove(customLocationOverlay)
                }
                // Create a simple static provider
                val staticLocationProvider = object : IMyLocationProvider {
                    override fun startLocationProvider(myLocationConsumer: IMyLocationConsumer?): Boolean {
                        myLocationConsumer?.onLocationChanged(
                            Location("").apply {
                                latitude = location.latitude
                                longitude = location.longitude
                            },
                            this
                        )
                        return true
                    }

                    override fun stopLocationProvider() {}
                    override fun getLastKnownLocation(): Location? = Location("").apply {
                        latitude = location.latitude
                        longitude = location.longitude
                    }

                    override fun destroy() {}
                }

                customLocationOverlay = CustomLocationOverlay(this, mapView, staticLocationProvider)
                customLocationOverlay?.enableMyLocation()
                customLocationOverlay?.startPulseAnimation()

                mapView.overlays.add(customLocationOverlay)
                mapView.controller.setCenter(location)
            }
        }
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

                // Collapse bottom sheet when map is clicked
                bottomSheetManager.collapse()
            }
            // Return false to allow the map to process the touch event as well
            false
        }
    }

    // Updated searchLocation method to calculate and display route
    @SuppressLint("MissingPermission")
    private fun searchLocation(query: String) {
        // Remove the custom location overlay before a new search/route
        if (customLocationOverlay != null) {
            mapView.overlays.remove(customLocationOverlay)
            customLocationOverlay = null
        }
        // Remove all route markers before a new search/route
        mapManager.removeAllMarkers()
        // Clear the previous route before drawing a new one
        mapManager.routeOverlay.clearRoute()

        searchService.searchLocation(
            query = query,
            onSuccess = { location ->
                val lat = location.lat.toDouble()
                val lon = location.lon.toDouble()
                val destinationPoint = GeoPoint(lat, lon)

                // Move to the location and add marker
                mapManager.moveToLocation(lat, lon)
                mapManager.addMarker(destinationPoint, location.display_name)

                // Get current location and calculate route
                if (hasLocationPermission()) {
                    locationService.getLastLocation { currentPoint ->
                        currentPoint?.let {
                            // Calculate and display route
                            getAndDisplayRoute(it, destinationPoint)
                        }
                    }
                } else {
                    Toast.makeText(this, "Location permission not granted", Toast.LENGTH_SHORT).show()
                }

                // Collapse the bottom sheet after successful search
                bottomSheetManager.collapse()
            },
            onEmpty = {
                Toast.makeText(this, "No results found", Toast.LENGTH_SHORT).show()
            },
            onError = { errorMessage ->
                Toast.makeText(this, "Search failed: $errorMessage", Toast.LENGTH_SHORT).show()
            }
        )
    }

    // New method to fetch and display route
    private fun getAndDisplayRoute(startPoint: GeoPoint, endPoint: GeoPoint) {
        // Show loading indicator
        Toast.makeText(this, "Calculating route...", Toast.LENGTH_SHORT).show()

        searchService.getRoute(
            startPoint = startPoint,
            endPoint = endPoint,
            routeOverlay = mapManager.routeOverlay,
            onRouteCalculated = { distance, duration ->
                Toast.makeText(
                    this,
                    "Distance: ${String.format("%.1f", distance)} km, Duration: ${String.format("%.0f", duration)} min",
                    Toast.LENGTH_LONG
                ).show()
            },
            onError = { errorMessage ->
                Toast.makeText(this, "Route calculation failed: $errorMessage", Toast.LENGTH_SHORT).show()
            }
        )
    }

    // Method to clear the route
    @SuppressLint("MissingPermission")
    private fun clearRoute() {
        // Remove custom location overlay
        if (customLocationOverlay != null) {
            mapView.overlays.remove(customLocationOverlay)
            customLocationOverlay = null
        }
        // Remove all route markers
        mapManager.removeAllMarkers()
        // Clear the route overlay
        mapManager.routeOverlay.clearRoute()
        // Also clear jeepney route overlay
        jeepneyRouteOverlay.clearRoute()
        // Clear search text in the bottom sheet
        bottomSheetManager.clearSearchText()
        // Show recents in the bottom sheet and expand it
        bottomSheetManager.showDefaultView()
        bottomSheetManager.expand()
        // Center and animate map on user's current location
        if (hasLocationPermission()) {
            locationService.getCurrentLocation { geoPoint ->
                geoPoint?.let {
                    mapView.controller.animateTo(it)
                    mapView.controller.setZoom(18.0)
                }
            }
        }
    }

    // Add this method to display a jeepney route
    private fun displayJeepneyRoute(relationId: String, routeColor: String) {
        CoroutineScope(Dispatchers.IO).launch {
            try {
                // Show loading indicator
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "Loading route...", Toast.LENGTH_SHORT).show()
                }

                // Get route coordinates
                val routePoints = routeService.getRouteByRelationId(relationId)

                withContext(Dispatchers.Main) {
                    if (routePoints.isNotEmpty()) {
                        // Draw the route on the map
                        jeepneyRouteOverlay.drawRoute(routePoints, routeColor)

                        // Hide loading indicator
                        Toast.makeText(this@MainActivity, "Route loaded successfully", Toast.LENGTH_SHORT).show()
                    } else {
                        Toast.makeText(this@MainActivity, "Failed to load route", Toast.LENGTH_SHORT).show()
                    }
                }
            } catch (e: Exception) {
                Log.e("MainActivity", "Error displaying jeepney route", e)
                withContext(Dispatchers.Main) {
                    Toast.makeText(this@MainActivity, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }

    // Add this method to your MainActivity
    private fun debugSpecificRoute(relationId: String) {
        CoroutineScope(Dispatchers.IO).launch {
            routeService.debugRoute(relationId)
        }
    }

    override fun onResume() {
        super.onResume()
        mapView.onResume()
        // Always refresh nav header with latest info
        val sharedPref = getSharedPreferences("app_prefs", MODE_PRIVATE)
        val username = sharedPref.getString("username", "Username")
        val email = sharedPref.getString("email", "emailaddress")
        updateNavHeader(username, email)
    }

    override fun onPause() {
        super.onPause()
        mapView.onPause()
    }

    // Dialog for manual lat/lon input
    private fun showManualLocationInputDialog() {
        val layout = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            val latInput = EditText(context).apply { hint = "Latitude"; inputType = android.text.InputType.TYPE_NUMBER_FLAG_DECIMAL or android.text.InputType.TYPE_CLASS_NUMBER or android.text.InputType.TYPE_NUMBER_FLAG_SIGNED }
            val lonInput = EditText(context).apply { hint = "Longitude"; inputType = android.text.InputType.TYPE_NUMBER_FLAG_DECIMAL or android.text.InputType.TYPE_CLASS_NUMBER or android.text.InputType.TYPE_NUMBER_FLAG_SIGNED }
            addView(latInput)
            addView(lonInput)
        }
        AlertDialog.Builder(this)
            .setTitle("Enter Initial Location")
            .setView(layout)
            .setPositiveButton("OK") { _, _ ->
                val latText = (layout.getChildAt(0) as EditText).text.toString()
                val lonText = (layout.getChildAt(1) as EditText).text.toString()
                try {
                    val lat = latText.toDouble()
                    val lon = lonText.toDouble()
                    val geoPoint = GeoPoint(lat, lon)
                    mapView.controller.setCenter(geoPoint)
                    mapView.controller.setZoom(18.0)
                    Toast.makeText(this, "Map centered to manual location", Toast.LENGTH_SHORT).show()
                } catch (e: Exception) {
                    Toast.makeText(this, "Invalid coordinates", Toast.LENGTH_SHORT).show()
                    showManualLocationInputDialog() // Retry
                }
            }
            .setNegativeButton("Cancel") { _, _ ->
                // Optionally, you can re-prompt or do nothing
            }
            .setCancelable(false)
            .show()
    }

    // Implementation for SearchAndClearFragment.OnRequestCurrentLocationListener
    @RequiresPermission(allOf = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION])
    override fun onRequestCurrentLocation(callback: (GeoPoint) -> Unit) {
        if (hasLocationPermission()) {
            locationService.getCurrentLocation { geoPoint ->
                callback(geoPoint)
            }
        } else {
            // Request permission and store the callback for later use
            pendingLocationCallback = callback
            ActivityCompat.requestPermissions(
                this,
                arrayOf(
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
                ),
                LOCATION_PERMISSION_REQUEST_CODE
            )
        }
    }

    // --- TESTING: Search and display a jeepney route by number ---
    private fun testShowJeepneyRouteByNumber(routeNumber: String) {
        routeService.lookupRouteByNumber(routeNumber) { route ->
            if (route != null) {
                runOnUiThread {
                    bottomSheetManager.showSingleJeepneyRoute(route)
                }
            } else {
                runOnUiThread {
                    Toast.makeText(this, "Route not found or error", Toast.LENGTH_SHORT).show()
                }
            }
        }
    }
}