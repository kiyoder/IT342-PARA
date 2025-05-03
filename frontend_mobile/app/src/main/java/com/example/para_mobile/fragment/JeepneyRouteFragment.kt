package com.example.para_mobile.fragment

import android.os.Bundle
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.KeyEvent
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.view.inputmethod.EditorInfo
import android.widget.EditText
import android.widget.ImageView
import android.widget.TextView
import android.widget.Toast
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.para_mobile.R
import com.example.para_mobile.activity.MainActivity
import com.example.para_mobile.adapter.JeepneyRouteAdapter
import com.example.para_mobile.api.RetrofitClient
import com.example.para_mobile.auth.TokenManager
import com.example.para_mobile.model.JeepneyRoute
import com.example.para_mobile.model.LocationResult
import com.example.para_mobile.service.JeepneyRouteService
import com.example.para_mobile.util.RouteOverlay
import org.osmdroid.util.GeoPoint
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response

class JeepneyRouteFragment : Fragment() {

    private val TAG = "JeepneyRouteFragment"
    private lateinit var backButton: ImageView
    private lateinit var locationInput: EditText
    private lateinit var destinationInput: EditText
    private lateinit var swapButton: ImageView
    private lateinit var routesRecyclerView: RecyclerView
    private lateinit var routesTitle: TextView
    private lateinit var tokenManager: TokenManager

    private var initialLocation: String = ""
    private var finalDestination: String = ""

    private var initialLat: Double = 0.0
    private var initialLon: Double = 0.0
    private var destinationLat: Double = 0.0
    private var destinationLon: Double = 0.0

    private val jeepneyRouteService = JeepneyRouteService()
    private var mapView: MapView? = null
    private var routeOverlay: RouteOverlay? = null

    private var initialMarker: Marker? = null
    private var destinationMarker: Marker? = null

    private var editingInitialLocation = false
    private var editingDestination = false

    interface OnRouteSelectedListener {
        fun onRouteSelected(route: JeepneyRoute, startPoint: GeoPoint, endPoint: GeoPoint)
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_jeepney_routes, container, false)

        tokenManager = TokenManager(requireContext())

        backButton = view.findViewById(R.id.backButton)
        locationInput = view.findViewById(R.id.locationInput)
        destinationInput = view.findViewById(R.id.destinationInput)
        swapButton = view.findViewById(R.id.swapButton)
        routesRecyclerView = view.findViewById(R.id.routesRecyclerView)
        routesTitle = view.findViewById(R.id.routesTitle)

        routesRecyclerView.layoutManager = LinearLayoutManager(requireContext())

        setupListeners()

        if (initialLocation.isNotEmpty()) locationInput.setText(initialLocation)
        if (finalDestination.isNotEmpty()) destinationInput.setText(finalDestination)

        // Only load routes if we have coordinates
        if (initialLat != 0.0 && initialLon != 0.0 && destinationLat != 0.0 && destinationLon != 0.0) {
            addLocationMarkers()
            loadJeepneyRoutes()
        } else if (initialLocation.isNotEmpty() && finalDestination.isNotEmpty()) {
            // We have location names but no coordinates, try to geocode them
            geocodeLocations()
        }

        return view
    }

    fun setMapView(mapView: MapView, routeOverlay: RouteOverlay) {
        this.mapView = mapView
        this.routeOverlay = routeOverlay

        // Add markers if coordinates are available
        if (initialLat != 0.0 && initialLon != 0.0 && destinationLat != 0.0 && destinationLon != 0.0) {
            addLocationMarkers()
        }
    }

    fun setRouteData(
        initial: String,
        destination: String,
        initialLat: Double = 0.0,
        initialLon: Double = 0.0,
        destinationLat: Double = 0.0,
        destinationLon: Double = 0.0
    ) {
        this.initialLocation = initial
        this.finalDestination = destination
        this.initialLat = initialLat
        this.initialLon = initialLon
        this.destinationLat = destinationLat
        this.destinationLon = destinationLon

        if (::locationInput.isInitialized && ::destinationInput.isInitialized) {
            locationInput.setText(initial)
            destinationInput.setText(destination)
        }
    }

    private fun setupListeners() {
        backButton.setOnClickListener {
            // Return to the default bottom sheet view
            (activity as? MainActivity)?.bottomSheetManager?.showDefaultView()
        }

        swapButton.setOnClickListener {
            val tempName = locationInput.text.toString()
            locationInput.setText(destinationInput.text.toString())
            destinationInput.setText(tempName)

            val tempLat = initialLat
            val tempLon = initialLon
            initialLat = destinationLat
            initialLon = destinationLon
            destinationLat = tempLat
            destinationLon = tempLon

            if (initialLat != 0.0 && initialLon != 0.0 && destinationLat != 0.0 && destinationLon != 0.0) {
                addLocationMarkers()
                loadJeepneyRoutes()
            } else {
                geocodeLocations()
            }
        }

        locationInput.setOnFocusChangeListener { _, hasFocus ->
            editingInitialLocation = hasFocus
            editingDestination = false
        }

        destinationInput.setOnFocusChangeListener { _, hasFocus ->
            editingDestination = hasFocus
            editingInitialLocation = false
        }

        locationInput.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {}
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                if (editingInitialLocation) {
                    initialLat = 0.0
                    initialLon = 0.0
                }
            }
        })

        destinationInput.addTextChangedListener(object : TextWatcher {
            override fun afterTextChanged(s: Editable?) {}
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}
            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                if (editingDestination) {
                    destinationLat = 0.0
                    destinationLon = 0.0
                }
            }
        })

        locationInput.setOnEditorActionListener { _, actionId, event ->
            if (actionId == EditorInfo.IME_ACTION_NEXT ||
                (event != null && event.keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_DOWN)
            ) {
                destinationInput.requestFocus()
                true
            } else false
        }

        destinationInput.setOnEditorActionListener { _, actionId, event ->
            if (actionId == EditorInfo.IME_ACTION_DONE ||
                (event != null && event.keyCode == KeyEvent.KEYCODE_ENTER && event.action == KeyEvent.ACTION_DOWN)
            ) {
                startSearchProcess()
                true
            } else false
        }
    }

    private fun startSearchProcess() {
        if (locationInput.text.isEmpty()) {
            Toast.makeText(context, "Please enter a starting location", Toast.LENGTH_SHORT).show()
            return
        }
        if (destinationInput.text.isEmpty()) {
            Toast.makeText(context, "Please enter a destination", Toast.LENGTH_SHORT).show()
            return
        }

        if (initialLat != 0.0 && initialLon != 0.0 && destinationLat != 0.0 && destinationLon != 0.0) {
            addLocationMarkers()
            loadJeepneyRoutes()
            return
        }

        geocodeLocations()
    }

    private fun geocodeLocations() {
        routesTitle.text = "Searching locations..."

        if (initialLat == 0.0 || initialLon == 0.0) {
            geocodeLocation(locationInput.text.toString(), true)
        } else if (destinationLat == 0.0 || destinationLon == 0.0) {
            geocodeLocation(destinationInput.text.toString(), false)
        } else {
            addLocationMarkers()
            loadJeepneyRoutes()
        }
    }

    private fun geocodeLocation(query: String, isInitialLocation: Boolean) {
        RetrofitClient.nominatimApi.searchLocation(query).enqueue(object : Callback<List<LocationResult>> {
            override fun onResponse(call: Call<List<LocationResult>>, response: Response<List<LocationResult>>) {
                if (response.isSuccessful && !response.body().isNullOrEmpty()) {
                    val location = response.body()!!.first()

                    if (isInitialLocation) {
                        initialLat = location.lat.toDouble()
                        initialLon = location.lon.toDouble()
                        if (destinationLat == 0.0 || destinationLon == 0.0) {
                            geocodeLocation(destinationInput.text.toString(), false)
                        } else {
                            addLocationMarkers()
                            loadJeepneyRoutes()
                        }
                    } else {
                        destinationLat = location.lat.toDouble()
                        destinationLon = location.lon.toDouble()
                        addLocationMarkers()
                        loadJeepneyRoutes()
                    }
                } else {
                    val loc = if (isInitialLocation) "starting location" else "destination"
                    Toast.makeText(context, "Could not find $loc", Toast.LENGTH_SHORT).show()
                    routesTitle.text = "Could not find location"
                }
            }

            override fun onFailure(call: Call<List<LocationResult>>, t: Throwable) {
                val loc = if (isInitialLocation) "starting location" else "destination"
                Toast.makeText(context, "Error finding $loc", Toast.LENGTH_SHORT).show()
                routesTitle.text = "Error finding location"
            }
        })
    }

    private fun addLocationMarkers() {
        if (mapView == null) return

        // Remove existing markers
        if (initialMarker != null) {
            mapView?.overlays?.remove(initialMarker)
            initialMarker = null
        }

        if (destinationMarker != null) {
            mapView?.overlays?.remove(destinationMarker)
            destinationMarker = null
        }

        // Add initial location marker (green)
        if (initialLat != 0.0 && initialLon != 0.0) {
            initialMarker = Marker(mapView).apply {
                position = GeoPoint(initialLat, initialLon)
                title = initialLocation
                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                icon = context?.let {
                    androidx.core.content.ContextCompat.getDrawable(it, R.drawable.ic_initial_location)
                }
            }
            mapView?.overlays?.add(initialMarker)
        }

        // Add destination marker (red)
        if (destinationLat != 0.0 && destinationLon != 0.0) {
            destinationMarker = Marker(mapView).apply {
                position = GeoPoint(destinationLat, destinationLon)
                title = finalDestination
                setAnchor(Marker.ANCHOR_CENTER, Marker.ANCHOR_BOTTOM)
                icon = context?.let {
                    androidx.core.content.ContextCompat.getDrawable(it, R.drawable.ic_custom_marker)
                }
            }
            mapView?.overlays?.add(destinationMarker)
        }

        // Zoom to show both markers
        if (initialMarker != null && destinationMarker != null) {
            zoomToPoints(listOf(
                GeoPoint(initialLat, initialLon),
                GeoPoint(destinationLat, destinationLon)
            ))
        }

        mapView?.invalidate()
    }

    private fun zoomToPoints(points: List<GeoPoint>) {
        if (points.isEmpty() || mapView == null) return

        // Find the bounding box of the points
        var minLat = Double.MAX_VALUE
        var maxLat = Double.MIN_VALUE
        var minLon = Double.MAX_VALUE
        var maxLon = Double.MIN_VALUE

        for (point in points) {
            minLat = minOf(minLat, point.latitude)
            maxLat = maxOf(maxLat, point.latitude)
            minLon = minOf(minLon, point.longitude)
            maxLon = maxOf(maxLon, point.longitude)
        }

        // Add some padding
        val padding = 0.01 // about 1km
        mapView?.zoomToBoundingBox(
            org.osmdroid.util.BoundingBox(
                maxLat + padding,
                maxLon + padding,
                minLat - padding,
                minLon - padding
            ),
            true
        )
    }

    private fun loadJeepneyRoutes() {
        routesTitle.text = "Finding routes..."
        val token = tokenManager.getToken()

        if (token.isNullOrEmpty()) {
            tokenManager.refreshToken(
                onSuccess = { newToken -> loadJeepneyRoutesWithToken(newToken) },
                onError = { error ->
                    routesTitle.text = "Authentication required"
                    Toast.makeText(requireContext(), "Please login again: $error", Toast.LENGTH_LONG).show()
                }
            )
        } else {
            loadJeepneyRoutesWithToken(token)
        }
    }

    private fun loadJeepneyRoutesWithToken(token: String) {
        jeepneyRouteService.getAllRoutes(
            token,
            requireContext(),
            onSuccess = { routes ->
                // Limit to 10 routes max
                val limitedRoutes = routes.take(10)
                routesTitle.text = "Suggested Routes (${limitedRoutes.size})"
                setupRecyclerView(limitedRoutes)
            },
            onEmpty = {
                routesTitle.text = "No routes found"
                setupRecyclerView(emptyList())
            },
            onError = { errorMessage ->
                routesTitle.text = "Error finding routes"
                Toast.makeText(requireContext(), "Error: $errorMessage", Toast.LENGTH_SHORT).show()
                setupRecyclerView(emptyList())
            }
        )
    }

    private fun setupRecyclerView(routes: List<JeepneyRoute>) {
        val adapter = JeepneyRouteAdapter(routes,
            onRouteSelected = { selectedRoute ->
                showRouteOnMap(selectedRoute)
            },
            onFavoriteToggled = { route, isFavorite ->
                // In a real app, you would save this to your database
                Toast.makeText(
                    requireContext(),
                    if (isFavorite) "Added ${route.routeNumber} to favorites"
                    else "Removed ${route.routeNumber} from favorites",
                    Toast.LENGTH_SHORT
                ).show()
            }
        )
        routesRecyclerView.adapter = adapter
    }

    private fun showRouteOnMap(route: JeepneyRoute) {
        if (mapView == null || routeOverlay == null) {
            Toast.makeText(requireContext(), "Map not available", Toast.LENGTH_SHORT).show()
            return
        }

        Toast.makeText(requireContext(), "Loading route: ${route.routeNumber}", Toast.LENGTH_SHORT).show()

        jeepneyRouteService.fetchRouteGeometry(
            relationId = route.relationId,
            routeOverlay = routeOverlay!!,
            onRouteLoaded = { routePoints ->
                if (routePoints.isNotEmpty()) {
                    // Calculate approximate distance
                    val distanceKm = calculateRouteDistance(routePoints)

                    // Show toast with route info
                    Toast.makeText(
                        requireContext(),
                        "Route ${route.routeNumber}: ${String.format("%.1f", distanceKm)} km",
                        Toast.LENGTH_LONG
                    ).show()

                    // Collapse the bottom sheet to show the map better
                    (activity as? MainActivity)?.bottomSheetManager?.collapse()

                    // Notify the activity about the selected route
                    (activity as? OnRouteSelectedListener)?.onRouteSelected(
                        route,
                        GeoPoint(initialLat, initialLon),
                        GeoPoint(destinationLat, destinationLon)
                    )
                }
            },
            onError = { errorMessage ->
                Toast.makeText(
                    requireContext(),
                    "Failed to load route: $errorMessage",
                    Toast.LENGTH_SHORT
                ).show()
            }
        )
    }

    private fun calculateRouteDistance(points: List<GeoPoint>): Double {
        var totalDistance = 0.0
        for (i in 0 until points.size - 1) {
            val p1 = points[i]
            val p2 = points[i + 1]
            totalDistance += calculateDistance(p1.latitude, p1.longitude, p2.latitude, p2.longitude)
        }
        return totalDistance
    }

    private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val r = 6371.0 // Earth radius in km
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)
        val c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
        return r * c
    }

    private fun zoomToRoute(routePoints: List<GeoPoint>) {
        if (routePoints.isEmpty() || mapView == null) return

        // Find the bounding box of the route
        var minLat = Double.MAX_VALUE
        var maxLat = Double.MIN_VALUE
        var minLon = Double.MAX_VALUE
        var maxLon = Double.MIN_VALUE

        for (point in routePoints) {
            minLat = minOf(minLat, point.latitude)
            maxLat = maxOf(maxLat, point.latitude)
            minLon = minOf(minLon, point.longitude)
            maxLon = maxOf(maxLon, point.longitude)
        }

        // Add some padding
        val padding = 0.01 // about 1km
        mapView?.zoomToBoundingBox(
            org.osmdroid.util.BoundingBox(
                maxLat + padding,
                maxLon + padding,
                minLat - padding,
                minLon - padding
            ),
            true
        )
    }
}
