package com.example.para_mobile.activity

import android.Manifest
import android.annotation.SuppressLint
import android.app.AlertDialog
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
import com.example.para_mobile.model.JeepneyRoute
import com.example.para_mobile.util.CustomLocationOverlay
import org.osmdroid.views.overlay.mylocation.IMyLocationConsumer
import org.osmdroid.views.overlay.mylocation.IMyLocationProvider
import com.example.para_mobile.fragment.JeepneyRouteFragment
import com.example.para_mobile.helper.PolylineDecoder
import com.example.para_mobile.util.RouteOverlay
import com.google.android.material.floatingactionbutton.FloatingActionButton

class MainActivity : AppCompatActivity(), NavigationView.OnNavigationItemSelectedListener {

    private lateinit var mapView: MapView
    lateinit var mapManager: MapManager
    private lateinit var locationService: LocationService
    private lateinit var searchService: SearchService
    lateinit var bottomSheetManager: BottomSheetManager
    private lateinit var drawerLayout: DrawerLayout
    private lateinit var bottomSheet: View
    private lateinit var sharedPrefs: SharedPreferences

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

        // 🧪 Hardcoded route test (Cebu City Hall to SM City Cebu)
        val cebuPolyline = "o{daFz{lzVd@l@`@v@t@fAd@h@x@r@dBxAtCbBpBhA`@Z"
        val decodedPoints = PolylineDecoder.decode(cebuPolyline)
        Log.d("PolylineTest", "Decoded Cebu points: $decodedPoints")

        // Draw the route
        routeOverlay.drawRoute(decodedPoints)

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
                // Handle logout logic: Clear the authentication token from SharedPreferences
                val editor = sharedPrefs.edit()
                editor.remove("jwt_token")  // Remove the JWT token using the correct key
                editor.remove("username")   // Also remove username
                editor.remove("email")      // Also remove email
                editor.remove("user_id")    // Also remove user ID
                editor.apply()

                // Clear cache (optional)
                cacheDir.deleteRecursively() // Clears the app's cache

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
            }
        )

        // Now you can initialize mapManager and pass bottomSheetManager into it
        mapManager = MapManager(this, mapView, bottomSheetManager)

        // Initialize location and search services
        locationService = LocationService(this)
        searchService = SearchService()
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
    }

    @RequiresPermission(allOf = [Manifest.permission.ACCESS_FINE_LOCATION, Manifest.permission.ACCESS_COARSE_LOCATION])
    private fun getUserLocation() {
        locationService.getCurrentLocation { geoPoint ->
            geoPoint?.let { location ->
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

                val customLocationOverlay = CustomLocationOverlay(this, mapView, staticLocationProvider)
                customLocationOverlay.enableMyLocation()
                customLocationOverlay.startPulseAnimation()

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
                locationService.getLastLocation { currentPoint ->
                    currentPoint?.let {
                        // Calculate and display route
                        getAndDisplayRoute(it, destinationPoint)
                    }
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
    private fun clearRoute() {
        mapManager.clearRoute(bottomSheetManager)
        bottomSheetManager.clearSearchText()
    }

    override fun onResume() {
        super.onResume()
        mapView.onResume()
    }

    override fun onPause() {
        super.onPause()
        mapView.onPause()
    }

    // Add this function to your MainActivity class
    fun testSimpleRoute() {
        // Define two points that are close to each other (about 1-2 km apart)
        // These are example coordinates in Cebu City - adjust to your location
        val startPoint = GeoPoint(10.3157, 123.8854) // Cebu City center
        val endPoint = GeoPoint(10.3100, 123.8900)   // A short distance away

        // Log the test
        Log.d("RouteTest", "Testing simple route between: $startPoint and $endPoint")

        // Show a toast to indicate testing
        Toast.makeText(this, "Testing simple route...", Toast.LENGTH_SHORT).show()

        // Calculate and display the route
        getAndDisplayRoute(startPoint, endPoint)
    }

    //NEw codes added on 27/04/2025
    fun onRouteSelected(route: JeepneyRoute, startPoint: GeoPoint, endPoint: GeoPoint) {
        // Add markers for the start and end points
        val startMarker = mapManager.addMarker(startPoint, "Start: ${route.routeNumber}")
        val endMarker = mapManager.addMarker(endPoint, "End: ${route.routeNumber}")

        // Move the map to show the start point
        mapManager.moveToLocation(startPoint.latitude, startPoint.longitude)

        // Show a toast with route info
        Toast.makeText(
            this,
            "Showing route: ${route.routeNumber} (${route.locations})", // Directly use the String
            Toast.LENGTH_SHORT
        ).show()
    }


    // Updated method to load the JeepneyRouteFragment
    fun loadJeepneyRouteFragment(fragment: JeepneyRouteFragment) {
        // Set the map view and route overlay
        fragment.setMapView(mapView, mapManager.routeOverlay)

        // We don't need to replace the fragment_container anymore
        // as the fragment will be loaded into the bottom sheet
    }
}
