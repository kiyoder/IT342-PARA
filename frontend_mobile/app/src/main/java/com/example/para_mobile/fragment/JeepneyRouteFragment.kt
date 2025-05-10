package com.example.para_mobile.fragment

import android.content.Context
import android.os.Bundle
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.para_mobile.R
import com.example.para_mobile.adapter.RouteAdapter
import com.example.para_mobile.model.RouteSearchResult
import com.example.para_mobile.service.RouteService
import com.example.para_mobile.util.JeepneyRouteOverlay
import com.example.para_mobile.util.RouteOverlay
import kotlinx.coroutines.*
import org.osmdroid.views.MapView

class JeepneyRouteFragment : Fragment() {
    private val TAG = "JeepneyRouteFragment"

    // UI Components
    private lateinit var clearRouteButton: ImageButton
    private lateinit var routesRecyclerView: RecyclerView
    private lateinit var initialLocationText: TextView
    private lateinit var destinationText: TextView
    private lateinit var loadingOverlay: View
    private lateinit var progressText: TextView
    private lateinit var noRoutesView: View

    // Map overlay
    private lateinit var jeepneyRouteOverlay: JeepneyRouteOverlay

    // Services
    private lateinit var routeService: RouteService

    // Map components
    private var mapView: MapView? = null
    private var routeOverlay: RouteOverlay? = null

    // Adapter
    private lateinit var routeAdapter: RouteAdapter

    // Data
    private var allRoutes: List<RouteSearchResult> = emptyList()
    private var matchingRoutes: List<RouteSearchResult> = emptyList()
    private var savedRoutes: MutableSet<String> = mutableSetOf()

    // Search parameters
    private var initialLat: Double = 0.0
    private var initialLon: Double = 0.0
    private var destinationLat: Double = 0.0
    private var destinationLon: Double = 0.0
    private var initialLocationName: String = ""
    private var destinationName: String = ""

    // Progress tracking
    private var progress: Int = 0
    private var totalRoutes: Int = 0

    private var isViewCreated = false
    private var pendingRouteData: (() -> Unit)? = null

    // Route colors
    private val routeColors = listOf(
        "#1D8C2E", "#8C1D1D", "#1D5F8C", "#8C6D1D", "#5D1D8C", "#E03000",
        "#996600", "#990066", "#4B0082"
    )

    // Callbacks
    private var onRouteSelectedListener: ((RouteSearchResult, String) -> Unit)? = null
    private var onClearRouteListener: (() -> Unit)? = null

    // Add this property at the top of the class
    private var pendingRouteToShow: RouteSearchResult? = null

    override fun onCreateView(
        inflater: LayoutInflater,
        container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_jeepney_route, container, false)

        // Initialize UI components
        clearRouteButton = view.findViewById(R.id.clear_route_button)
        routesRecyclerView = view.findViewById(R.id.routesRecyclerView)
        initialLocationText = view.findViewById(R.id.initial_location_placeholder)
        destinationText = view.findViewById(R.id.destination_placeholder)

        loadingOverlay = LayoutInflater.from(context).inflate(R.layout.loading_overlay, container, false)
        progressText = loadingOverlay.findViewById(R.id.progress_text)

        noRoutesView = LayoutInflater.from(context).inflate(R.layout.no_routes_view, container, false)

        routeService = RouteService(requireContext())
        routesRecyclerView.layoutManager = LinearLayoutManager(context)

        clearRouteButton.setOnClickListener {
            onClearRouteListener?.invoke()
        }

        return view
    }

    override fun onViewCreated(view: View, savedInstanceState: Bundle?) {
        super.onViewCreated(view, savedInstanceState)

        isViewCreated = true

        loadSavedRoutes()
        pendingRouteData?.invoke()
        pendingRouteData = null

        routeAdapter = RouteAdapter(
            routes = emptyList(),
            savedRoutes = savedRoutes,
            onSaveToggle = { route, isSaved -> handleSaveRoute(route, isSaved) }
        )

        // ✅ Updated route click listener to draw route on map
        routeAdapter.setOnRouteClickListener { route, position ->
            val colorIndex = position % routeColors.size
            val routeColor = routeColors[colorIndex]

            CoroutineScope(Dispatchers.Main).launch {
                try {
                    if (route.routeSegments.isNotEmpty()) {
                        jeepneyRouteOverlay.drawRouteSegments(route.routeSegments, routeColor)
                        onRouteSelectedListener?.invoke(route, routeColor)
                    } else if (route.routePoints.isNotEmpty()) {
                        jeepneyRouteOverlay.drawRoute(route.routePoints, routeColor)
                        onRouteSelectedListener?.invoke(route, routeColor)
                    } else {
                        Toast.makeText(context, "Failed to load route", Toast.LENGTH_SHORT).show()
                    }
                } catch (e: Exception) {
                    Log.e(TAG, "Error displaying route", e)
                    Toast.makeText(context, "Error: ${e.message}", Toast.LENGTH_SHORT).show()
                }
            }
        }

        routesRecyclerView.adapter = routeAdapter

        // --- NEW: If a route was pending, show it now ---
        if (pendingRouteToShow != null) {
            showSingleRoute(pendingRouteToShow!!)
            pendingRouteToShow = null
        }
    }

    fun setMapView(mapView: MapView, routeOverlay: RouteOverlay, jeepneyRouteOverlay: JeepneyRouteOverlay) {
        this.mapView = mapView
        this.routeOverlay = routeOverlay
        this.jeepneyRouteOverlay = jeepneyRouteOverlay
    }

    fun setRouteData(
        initialLocationName: String,
        destinationName: String,
        initialLat: Double,
        initialLon: Double,
        destinationLat: Double,
        destinationLon: Double
    ) {
        val applyData = {
            this.initialLocationName = initialLocationName
            this.destinationName = destinationName
            this.initialLat = initialLat
            this.initialLon = initialLon
            this.destinationLat = destinationLat
            this.destinationLon = destinationLon

            initialLocationText.text = "From: $initialLocationName"
            destinationText.text = "To: $destinationName"

            searchRoutes()
        }

        if (isViewCreated) {
            applyData()
        } else {
            pendingRouteData = applyData
        }
    }

    private fun searchRoutes() {
        Log.d(TAG, "Starting route search from $initialLocationName to $destinationName")
        Log.d(TAG, "Coordinates: ($initialLat, $initialLon) to ($destinationLat, $destinationLon)")
        showLoading(true)
        fetchAllRoutes()
    }

    private fun fetchAllRoutes() {
        routeService.fetchAllRoutes(
            onSuccess = { routes ->
                allRoutes = routes
                totalRoutes = routes.size
                Log.d(TAG, "Fetched ${routes.size} routes")

                findNearbyRoutes()
            },
            onError = { errorMessage ->
                Log.e(TAG, "Error fetching routes: $errorMessage")
                Toast.makeText(context, errorMessage, Toast.LENGTH_SHORT).show()
                showLoading(false)
            }
        )
    }

    // Add these lines to the findNearbyRoutes() method in JeepneyRouteFragment.kt
    private fun findNearbyRoutes() {
        Log.d(TAG, "Finding nearby routes between ($initialLat, $initialLon) and ($destinationLat, $destinationLon)")
        routeService.findNearbyRoutes(
            allRoutes = allRoutes,
            initialLat = initialLat,
            initialLon = initialLon,
            destinationLat = destinationLat,
            destinationLon = destinationLon,
            proximityRadius = 500.0, // 500 meters radius
            onProgress = { current, total ->
                activity?.runOnUiThread {
                    updateProgress(current, total)
                }
            },
            onComplete = { results ->
                Log.d(TAG, "Route search completed with ${results.size} results")
                if (results.isEmpty()) {
                    Log.d(TAG, "No routes found between the specified locations")
                } else {
                    Log.d(TAG, "Routes found: ${results.joinToString { it.routeNumber }}")
                }

                activity?.runOnUiThread {
                    setRouteSearchResults(results)
                    showLoading(false)
                }
            }
        )
    }

    private fun setRouteSearchResults(routes: List<RouteSearchResult>) {
        matchingRoutes = routes
        routeAdapter.updateData(routes)

        showNoRoutesView(routes.isEmpty())

        // Auto-select and draw the first route if available
        if (routes.isNotEmpty()) {
            val firstRoute = routes[0]
            val colorIndex = 0 % routeColors.size
            val routeColor = routeColors[colorIndex]
            if (firstRoute.routeSegments.isNotEmpty()) {
                jeepneyRouteOverlay.drawRouteSegments(firstRoute.routeSegments, routeColor)
                onRouteSelectedListener?.invoke(firstRoute, routeColor)
            } else if (firstRoute.routePoints.isNotEmpty()) {
                jeepneyRouteOverlay.drawRoute(firstRoute.routePoints, routeColor)
                onRouteSelectedListener?.invoke(firstRoute, routeColor)
            }
        }
    }

    private fun handleSaveRoute(route: RouteSearchResult, isSaved: Boolean) {
        val routeKey = "${route.routeNumber}:${initialLocationName}:${destinationName}"
        if (isSaved) {
            savedRoutes.add(routeKey)
            Toast.makeText(context, "Route saved", Toast.LENGTH_SHORT).show()
        } else {
            savedRoutes.remove(routeKey)
            Toast.makeText(context, "Route removed", Toast.LENGTH_SHORT).show()
        }

        saveSavedRoutes()
        routeAdapter.updateSavedRoutes(savedRoutes)
    }

    private fun loadSavedRoutes() {
        val prefs = requireContext().getSharedPreferences("saved_routes", Context.MODE_PRIVATE)
        savedRoutes = prefs.getStringSet("routes", mutableSetOf())?.toMutableSet() ?: mutableSetOf()
    }

    private fun saveSavedRoutes() {
        val prefs = requireContext().getSharedPreferences("saved_routes", Context.MODE_PRIVATE)
        prefs.edit().putStringSet("routes", savedRoutes).apply()
    }

    private fun showLoading(show: Boolean) {
        val parent = view as? ViewGroup
        if (show) {
            if (parent != null && loadingOverlay.parent == null) {
                parent.addView(loadingOverlay)
            }
            loadingOverlay.visibility = View.VISIBLE
            routesRecyclerView.visibility = View.GONE
            noRoutesView.visibility = View.GONE
        } else {
            loadingOverlay.visibility = View.GONE
            routesRecyclerView.visibility = View.VISIBLE
        }
    }

    private fun showNoRoutesView(show: Boolean) {
        val parent = view as? ViewGroup
        if (show) {
            if (parent != null && noRoutesView.parent == null) {
                parent.addView(noRoutesView)
            }
            noRoutesView.visibility = View.VISIBLE
            routesRecyclerView.visibility = View.GONE
        } else {
            noRoutesView.visibility = View.GONE
            routesRecyclerView.visibility = View.VISIBLE
        }
    }

    private fun updateProgress(current: Int, total: Int) {
        val percentage = (current * 100) / total
        progressText.text = "Scanning routes: $percentage%"
    }

    fun setOnRouteSelectedListener(listener: (RouteSearchResult, String) -> Unit) {
        onRouteSelectedListener = listener
    }

    fun setOnClearRouteListener(listener: () -> Unit) {
        onClearRouteListener = listener
    }

    // --- TESTING: Show a single route by code ---
    fun showSingleRoute(route: RouteSearchResult) {
        if (!::routeAdapter.isInitialized) {
            pendingRouteToShow = route
            return
        }
        matchingRoutes = listOf(route)
        routeAdapter.updateData(matchingRoutes)
        showNoRoutesView(false)
        showLoading(false)
        // Optionally, auto-select and draw the route
        val colorIndex = 0 % routeColors.size
        val routeColor = routeColors[colorIndex]
        val segments = route.routeSegments ?: emptyList()
        val points = route.routePoints ?: emptyList()
        if (segments.isNotEmpty()) {
            jeepneyRouteOverlay.drawRouteSegments(segments, routeColor)
            onRouteSelectedListener?.invoke(route, routeColor)
        } else if (points.isNotEmpty()) {
            jeepneyRouteOverlay.drawRoute(points, routeColor)
            onRouteSelectedListener?.invoke(route, routeColor)
        }
    }

}
