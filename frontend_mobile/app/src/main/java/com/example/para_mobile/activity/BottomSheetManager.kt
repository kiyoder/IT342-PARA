package com.example.para_mobile.activity

import android.content.Context
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentManager
import com.example.para_mobile.R
import com.example.para_mobile.fragment.ActionButtonsFragment
import com.example.para_mobile.fragment.FavoritesFragment
import com.example.para_mobile.fragment.JeepneyRouteFragment
import com.example.para_mobile.fragment.RecentsFragment
import com.example.para_mobile.fragment.SearchAndClearFragment
import com.google.android.material.bottomsheet.BottomSheetBehavior
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView

class BottomSheetManager(
    private val context: Context,
    private val bottomSheet: View,
    private val fragmentManager: FragmentManager,
    private val onSearchQuery: (String) -> Unit,
    private val onMarkLocation: () -> Unit,
    private val onClearRoute: () -> Unit
) {
    private val bottomSheetBehavior: BottomSheetBehavior<View> = BottomSheetBehavior.from(bottomSheet)

    // Fragment references
    private lateinit var searchAndClearFragment: SearchAndClearFragment
    private lateinit var favoritesFragment: FavoritesFragment
    private lateinit var recentsFragment: RecentsFragment
    private lateinit var actionButtonsFragment: ActionButtonsFragment
    private var jeepneyRouteFragment: JeepneyRouteFragment? = null

    // Store user's current location
    private var userCurrentLocation: Pair<Double, Double>? = null

    // Reference to MapView and RouteOverlay
    private var mapView: MapView? = null
    private var routeOverlay: com.example.para_mobile.util.RouteOverlay? = null

    init {
        setupBottomSheet()
        setupFragments()
        setupFragmentListeners()
    }

    fun setMapView(mapView: MapView, routeOverlay: com.example.para_mobile.util.RouteOverlay) {
        this.mapView = mapView
        this.routeOverlay = routeOverlay
    }

    private fun setupBottomSheet() {
        // Set the initial state (collapsed but visible)
        bottomSheetBehavior.state = BottomSheetBehavior.STATE_COLLAPSED

        // Set up bottom sheet callbacks
        bottomSheetBehavior.addBottomSheetCallback(object : BottomSheetBehavior.BottomSheetCallback() {
            override fun onStateChanged(bottomSheet: View, newState: Int) {
                when (newState) {
                    BottomSheetBehavior.STATE_EXPANDED -> {
                        // Focus on search when expanded if search fragment is visible
                        if (bottomSheet.findViewById<View>(R.id.search_and_clear_container).visibility == View.VISIBLE) {
                            searchAndClearFragment.focusSearchField()
                        }
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
    }

    private fun setupFragments() {
        // Find existing fragments or create new ones
        searchAndClearFragment = findOrCreateFragment(SearchAndClearFragment::class.java, R.id.search_and_clear_container)
        favoritesFragment = findOrCreateFragment(FavoritesFragment::class.java, R.id.favorites_container)
        recentsFragment = findOrCreateFragment(RecentsFragment::class.java, R.id.recents_container)
        actionButtonsFragment = findOrCreateFragment(ActionButtonsFragment::class.java, R.id.action_buttons_container)
    }

    private inline fun <reified T : Fragment> findOrCreateFragment(clazz: Class<T>, containerId: Int): T {
        val tag = clazz.simpleName
        val existingFragment = fragmentManager.findFragmentByTag(tag) as? T

        if (existingFragment != null) {
            return existingFragment
        }

        val newFragment = clazz.newInstance()
        fragmentManager.beginTransaction()
            .replace(containerId, newFragment, tag)
            .commit()

        return newFragment
    }

    private fun setupFragmentListeners() {
        searchAndClearFragment.setOnSearchListener { query, lat, lng ->
            if (query.isNotEmpty()) {
                onSearchQuery(query)

                // Get the user's current location or use a default location in Cebu
                val currentLocation = userCurrentLocation ?: Pair(10.3157, 123.8854) // Default to Cebu City center

                // Create and launch the JeepneyRouteFragment with the current location and searched destination
                val jeepneyRouteFragment = JeepneyRouteFragment()

                // Get a readable location name for the current location
                val currentLocationName = "Current Location"

                // Set the route data with current location as origin and searched location as destination
                jeepneyRouteFragment.setRouteData(
                    currentLocationName,
                    query,
                    currentLocation.first,
                    currentLocation.second,
                    lat as Double,
                    lng as Double
                )

                // Launch the fragment in the bottom sheet
                launchJeepneyRouteFragment(jeepneyRouteFragment)

                // Expand the bottom sheet to show the routes
                expand()

            } else {
                Toast.makeText(context, "Please enter a location to search", Toast.LENGTH_SHORT).show()
            }
        }

        searchAndClearFragment.setOnVoiceSearchListener {
            // Implement voice search functionality
            Toast.makeText(context, "Voice search not implemented", Toast.LENGTH_SHORT).show()
        }

        searchAndClearFragment.setOnClearRouteListener {
            onClearRoute()
            showDefaultView()
            Toast.makeText(context, "Route cleared", Toast.LENGTH_SHORT).show()
        }

        // Set up favorites fragment listeners
        favoritesFragment.setOnHomeLocationListener {
            // Handle home location click
            Toast.makeText(context, "Navigate to home", Toast.LENGTH_SHORT).show()
            // You could add code to navigate to a saved home location
        }

        favoritesFragment.setOnWorkLocationListener {
            // Handle work location click
            Toast.makeText(context, "Navigate to work", Toast.LENGTH_SHORT).show()
            // You could add code to navigate to a saved work location
        }

        favoritesFragment.setOnAddLocationListener {
            // Handle add location click
            Toast.makeText(context, "Add new favorite location", Toast.LENGTH_SHORT).show()
            // You could add code to add the current location as a favorite
        }

        // Set up recents fragment listener
        recentsFragment.setOnRecentLocationListener { locationName ->
            Toast.makeText(context, "Navigate to $locationName", Toast.LENGTH_SHORT).show()
            // Search for this location
            onSearchQuery(locationName)
        }

        // Set up action buttons fragment listeners
        actionButtonsFragment.setOnMarkLocationListener {
            onMarkLocation()
            Toast.makeText(context, "Marked your current location", Toast.LENGTH_SHORT).show()
        }

        actionButtonsFragment.setOnReportIssueListener {
            // Handle report issue click
            Toast.makeText(context, "Report an issue", Toast.LENGTH_SHORT).show()
            // You could open a form to report an issue
        }
    }

    private fun launchJeepneyRouteFragment(fragment: JeepneyRouteFragment) {
        // Set the map view and route overlay
        if (mapView != null && routeOverlay != null) {
            fragment.setMapView(mapView!!, routeOverlay!!)
        }

        // Hide all default containers
        bottomSheet.findViewById<View>(R.id.search_and_clear_container).visibility = View.GONE
        bottomSheet.findViewById<View>(R.id.favorites_container).visibility = View.GONE
        bottomSheet.findViewById<View>(R.id.recents_container).visibility = View.GONE
        bottomSheet.findViewById<View>(R.id.action_buttons_container).visibility = View.GONE
        bottomSheet.findViewById<View>(R.id.search_suggestion_container).visibility = View.GONE

        // Show the jeepney route container
        bottomSheet.findViewById<View>(R.id.jeepney_route_container).visibility = View.VISIBLE

        // Replace the fragment in the jeepney route container
        fragmentManager.beginTransaction()
            .replace(R.id.jeepney_route_container, fragment, "JeepneyRouteFragment")
            .commit()

        // Store reference to the fragment
        this.jeepneyRouteFragment = fragment
    }

    fun showDefaultView() {
        // Hide the jeepney route container
        bottomSheet.findViewById<View>(R.id.jeepney_route_container).visibility = View.GONE

        // Show all default containers
        bottomSheet.findViewById<View>(R.id.search_and_clear_container).visibility = View.VISIBLE
        bottomSheet.findViewById<View>(R.id.favorites_container).visibility = View.VISIBLE
        bottomSheet.findViewById<View>(R.id.recents_container).visibility = View.VISIBLE
        bottomSheet.findViewById<View>(R.id.action_buttons_container).visibility = View.VISIBLE

        // Clear the reference
        this.jeepneyRouteFragment = null

        // Clear search text
        clearSearchText()
    }

    // Method to update the user's current location
    fun updateUserLocation(latitude: Double, longitude: Double) {
        userCurrentLocation = Pair(latitude, longitude)
    }

    fun expand() {
        bottomSheetBehavior.state = BottomSheetBehavior.STATE_EXPANDED
    }

    fun collapse() {
        bottomSheetBehavior.state = BottomSheetBehavior.STATE_COLLAPSED
    }

    fun getState(): Int {
        return bottomSheetBehavior.state
    }

    fun clearSearchText() {
        searchAndClearFragment.clearSearchText()
    }

    // New method to set search text programmatically
    fun setSearchText(text: String) {
        searchAndClearFragment.setSearchText(text)
    }
}
