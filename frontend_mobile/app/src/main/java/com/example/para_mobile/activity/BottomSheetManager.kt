package com.example.para_mobile.activity

import android.content.Context
import android.view.View
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.fragment.app.FragmentManager
import com.example.para_mobile.R
import com.example.para_mobile.fragment.*
import com.example.para_mobile.util.JeepneyRouteOverlay
import com.example.para_mobile.util.RouteOverlay
import com.google.android.material.bottomsheet.BottomSheetBehavior
import org.osmdroid.views.MapView
import androidx.core.content.ContextCompat

class BottomSheetManager(
    private val context: Context,
    private val bottomSheet: View,
    private val fragmentManager: FragmentManager,
    private val onSearchQuery: (String) -> Unit,
    private val onMarkLocation: () -> Unit,
    private val onClearRoute: () -> Unit,
    private val searchService: SearchService
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

    // Map references
    private var mapView: MapView? = null
    private var routeOverlay: RouteOverlay? = null
    private var mapManager: MapManager? = null

    // ✅ Added JeepneyRouteOverlay reference
    private var jeepneyRouteOverlay: JeepneyRouteOverlay? = null

    // Reference to the current CustomLocationOverlay (orange dot)
    private var customLocationOverlay: com.example.para_mobile.util.CustomLocationOverlay? = null

    init {
        setupBottomSheet()
        setupFragments()
        setupFragmentListeners()
    }

    // ✅ Updated to accept JeepneyRouteOverlay
    fun setMapView(mapView: MapView, routeOverlay: RouteOverlay, jeepneyRouteOverlay: JeepneyRouteOverlay) {
        this.mapView = mapView
        this.routeOverlay = routeOverlay
        this.jeepneyRouteOverlay = jeepneyRouteOverlay
    }

    fun setMapManager(mapManager: MapManager) {
        this.mapManager = mapManager
    }

    private fun setupBottomSheet() {
        // Set peek height to 30% of the screen
        val displayMetrics = context.resources.displayMetrics
        val screenHeight = displayMetrics.heightPixels
        val peekHeight = (screenHeight * 0.3).toInt()
        bottomSheetBehavior.peekHeight = peekHeight
        bottomSheetBehavior.state = BottomSheetBehavior.STATE_COLLAPSED

        bottomSheetBehavior.addBottomSheetCallback(object : BottomSheetBehavior.BottomSheetCallback() {
            override fun onStateChanged(bottomSheet: View, newState: Int) {
                if (newState == BottomSheetBehavior.STATE_EXPANDED) {
                    if (bottomSheet.findViewById<View>(R.id.search_and_clear_container).visibility == View.VISIBLE) {
                        searchAndClearFragment.focusSearchField()
                    }
                }
            }

            override fun onSlide(bottomSheet: View, slideOffset: Float) {}
        })
    }

    private fun setupFragments() {
        searchAndClearFragment = findOrCreateFragment(SearchAndClearFragment::class.java, R.id.search_and_clear_container)
        favoritesFragment = findOrCreateFragment(FavoritesFragment::class.java, R.id.favorites_container)
        recentsFragment = findOrCreateFragment(RecentsFragment::class.java, R.id.recents_container)
        actionButtonsFragment = findOrCreateFragment(ActionButtonsFragment::class.java, R.id.action_buttons_container)
    }

    private inline fun <reified T : Fragment> findOrCreateFragment(clazz: Class<T>, containerId: Int): T {
        val tag = clazz.simpleName
        val existingFragment = fragmentManager.findFragmentByTag(tag) as? T
        if (existingFragment != null) return existingFragment

        val newFragment = clazz.newInstance()
        fragmentManager.beginTransaction()
            .replace(containerId, newFragment, tag)
            .commit()
        return newFragment
    }

    private fun setupFragmentListeners() {
        searchAndClearFragment.setOnSearchListener { initialName: String, initialLat: Double, initialLon: Double, destName: String, destLat: Double, destLon: Double ->
            if (destName.isNotEmpty() && initialName.isNotEmpty()) {
                // Always remove custom location overlay after search
                mapView?.let { map ->
                    customLocationOverlay?.let { map.overlays.remove(it) }
                    customLocationOverlay = null
                }
                // Hide suggestions in the fragment and bottom sheet
                searchAndClearFragment.hideSuggestions()
                bottomSheet.findViewById<View?>(R.id.search_suggestion_container)?.visibility = View.GONE
                val jeepneyRouteFragment = JeepneyRouteFragment()
                jeepneyRouteFragment.setRouteData(
                    initialName,
                    destName,
                    initialLat,
                    initialLon,
                    destLat,
                    destLon
                )
                launchJeepneyRouteFragment(jeepneyRouteFragment)
                expand()
                // Set bottom sheet to 30% after searching route location
                val displayMetrics = context.resources.displayMetrics
                val screenHeight = displayMetrics.heightPixels
                val peekHeight = (screenHeight * 0.3).toInt()
                bottomSheetBehavior.peekHeight = peekHeight
                bottomSheetBehavior.state = BottomSheetBehavior.STATE_COLLAPSED
                mapManager?.zoomToShowMarkersWithBottomPadding(0.3)
            } else {
                Toast.makeText(context, "Please enter both initial and destination locations", Toast.LENGTH_SHORT).show()
            }
        }

        searchAndClearFragment.setOnClearRouteListener {
            onClearRoute()
            showDefaultView()
            Toast.makeText(context, "Route cleared", Toast.LENGTH_SHORT).show()
        }

        searchAndClearFragment.setOnDirectRouteRequestedListener { initialLat, initialLon, destLat, destLon ->
            // Always remove the overlay before drawing a new route
            mapView?.let { map ->
                customLocationOverlay?.let { map.overlays.remove(it) }
                customLocationOverlay = null
            }
            // Hide suggestions in the fragment and bottom sheet after direct route
            searchAndClearFragment.hideSuggestions()
            bottomSheet.findViewById<View?>(R.id.search_suggestion_container)?.visibility = View.GONE
            // Draw direct route using OSRM API and PolylineDecoder
            val start = org.osmdroid.util.GeoPoint(initialLat, initialLon)
            val end = org.osmdroid.util.GeoPoint(destLat, destLon)
            routeOverlay?.let { overlay ->
                searchService.getRoute(
                    startPoint = start,
                    endPoint = end,
                    routeOverlay = overlay,
                    onRouteCalculated = { _, _ -> },
                    onError = { msg -> Toast.makeText(context, "Route error: $msg", Toast.LENGTH_SHORT).show() }
                )
            }
            mapManager?.addMarker(start, "Origin")
            mapManager?.addMarker(end, "Destination")
            mapManager?.zoomToShowMarkersWithBottomPadding(0.3)
            // Set bottom sheet to 30% after searching route location
            val displayMetrics = context.resources.displayMetrics
            val screenHeight = displayMetrics.heightPixels
            val peekHeight = (screenHeight * 0.3).toInt()
            bottomSheetBehavior.peekHeight = peekHeight
            bottomSheetBehavior.state = BottomSheetBehavior.STATE_COLLAPSED
        }

        favoritesFragment.setOnHomeLocationListener {
            Toast.makeText(context, "Navigate to home", Toast.LENGTH_SHORT).show()
        }

        favoritesFragment.setOnWorkLocationListener {
            Toast.makeText(context, "Navigate to work", Toast.LENGTH_SHORT).show()
        }

        favoritesFragment.setOnAddLocationListener {
            Toast.makeText(context, "Add new favorite location", Toast.LENGTH_SHORT).show()
        }

        recentsFragment.setOnRecentLocationListener { recentRoute ->
            searchAndClearFragment.setInitialAndDestination(
                recentRoute.initialName, recentRoute.initialLat, recentRoute.initialLon,
                recentRoute.destName, recentRoute.destLat, recentRoute.destLon
            )
            // Set bottom sheet to 30% after searching route location
            val displayMetrics = context.resources.displayMetrics
            val screenHeight = displayMetrics.heightPixels
            val peekHeight = (screenHeight * 0.3).toInt()
            bottomSheetBehavior.peekHeight = peekHeight
            bottomSheetBehavior.state = BottomSheetBehavior.STATE_COLLAPSED
        }

        actionButtonsFragment.setOnMarkLocationListener {
            onMarkLocation()
            Toast.makeText(context, "Marked your current location", Toast.LENGTH_SHORT).show()
        }

        actionButtonsFragment.setOnReportIssueListener {
            Toast.makeText(context, "Report an issue", Toast.LENGTH_SHORT).show()
        }
    }

    // ✅ Updated to include jeepneyRouteOverlay
    private fun launchJeepneyRouteFragment(fragment: JeepneyRouteFragment) {
        if (mapView != null && routeOverlay != null && jeepneyRouteOverlay != null) {
            fragment.setMapView(mapView!!, routeOverlay!!, jeepneyRouteOverlay!!)
        }

        bottomSheet.findViewById<View>(R.id.favorites_container).visibility = View.GONE
        bottomSheet.findViewById<View>(R.id.recents_container).visibility = View.GONE
        bottomSheet.findViewById<View>(R.id.action_buttons_container).visibility = View.GONE
        bottomSheet.findViewById<View>(R.id.search_suggestion_container).visibility = View.GONE

        bottomSheet.findViewById<View>(R.id.jeepney_route_container).visibility = View.VISIBLE

        fragmentManager.beginTransaction()
            .replace(R.id.jeepney_route_container, fragment, "JeepneyRouteFragment")
            .commit()

        this.jeepneyRouteFragment = fragment
    }

    fun showDefaultView() {
        bottomSheet.findViewById<View>(R.id.jeepney_route_container).visibility = View.GONE

        bottomSheet.findViewById<View>(R.id.search_and_clear_container).visibility = View.VISIBLE
        bottomSheet.findViewById<View>(R.id.favorites_container).visibility = View.VISIBLE
        bottomSheet.findViewById<View>(R.id.recents_container).visibility = View.VISIBLE
        bottomSheet.findViewById<View>(R.id.action_buttons_container).visibility = View.VISIBLE

        this.jeepneyRouteFragment = null
        clearSearchText()
    }

    fun updateUserLocation(latitude: Double, longitude: Double) {
        userCurrentLocation = Pair(latitude, longitude)
    }

    fun expand() {
        bottomSheetBehavior.state = BottomSheetBehavior.STATE_EXPANDED
    }

    fun collapse() {
        bottomSheetBehavior.state = BottomSheetBehavior.STATE_COLLAPSED
    }

    fun getState(): Int = bottomSheetBehavior.state

    fun clearSearchText() {
        searchAndClearFragment.clearSearchText()
    }

    fun setSearchText(text: String) {
        searchAndClearFragment.setSearchText(text)
    }

    // --- TESTING: Show JeepneyRouteFragment with a single route ---
    fun showSingleJeepneyRoute(route: com.example.para_mobile.model.RouteSearchResult) {
        val fragment = JeepneyRouteFragment()
        if (mapView != null && routeOverlay != null && jeepneyRouteOverlay != null) {
            fragment.setMapView(mapView!!, routeOverlay!!, jeepneyRouteOverlay!!)
        }
        fragment.showSingleRoute(route)
        bottomSheet.findViewById<View>(R.id.favorites_container).visibility = View.GONE
        bottomSheet.findViewById<View>(R.id.recents_container).visibility = View.GONE
        bottomSheet.findViewById<View>(R.id.action_buttons_container).visibility = View.GONE
        bottomSheet.findViewById<View>(R.id.search_suggestion_container).visibility = View.GONE
        bottomSheet.findViewById<View>(R.id.jeepney_route_container).visibility = View.VISIBLE
        fragmentManager.beginTransaction()
            .replace(R.id.jeepney_route_container, fragment, "JeepneyRouteFragment")
            .commit()
        this.jeepneyRouteFragment = fragment
        expand()
    }
}
