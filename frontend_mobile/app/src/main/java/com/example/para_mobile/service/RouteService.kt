package com.example.para_mobile.service

import android.content.Context
import android.util.Log
import com.example.para_mobile.api.RetrofitClient
import com.example.para_mobile.model.RouteSearchResult
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import org.osmdroid.util.GeoPoint
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import kotlin.math.acos
import kotlin.math.atan2
import kotlin.math.cos
import kotlin.math.pow
import kotlin.math.sin
import kotlin.math.sqrt

class RouteService(private val context: Context) {
    private val TAG = "RouteService"
    val osmRouteParser = OSMRouteParser(RetrofitClient.overpassApi)

    // Cache for route coordinates to avoid repeated API calls
    private val routeCoordinatesCache = mutableMapOf<String, List<GeoPoint>>()

    private fun getAuthToken(): String? {
        val prefs = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        val token = prefs.getString("jwt_token", null)
        return token?.let {
            if (it.startsWith("Bearer ")) it else "Bearer $it"
        }
    }

    /**
     * Fetch all jeepney routes from the backend
     */
    fun fetchAllRoutes(
        onSuccess: (List<RouteSearchResult>) -> Unit,
        onError: (String) -> Unit
    ) {
        val token = getAuthToken()

        if (token == null) {
            onError("No auth token found.")
            return
        }

        Log.d(TAG, "Fetching all routes with token: $token")

        RetrofitClient.instance.getAllRoutes().enqueue(object : Callback<List<RouteSearchResult>> {
            override fun onResponse(
                call: Call<List<RouteSearchResult>>,
                response: Response<List<RouteSearchResult>>
            ) {
                if (response.isSuccessful) {
                    response.body()?.let {
                        Log.d(TAG, "Successfully fetched ${it.size} routes from backend")
                        onSuccess(it)
                    } ?: onError("Empty response")
                } else {
                    onError("Failed to fetch routes: ${response.code()}")
                }

                Log.d(TAG, "Status Code: ${response.code()}, Body: ${response.body()}")
            }

            override fun onFailure(call: Call<List<RouteSearchResult>>, t: Throwable) {
                Log.e(TAG, "Failed to fetch routes: ${t.message}", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }

    /**
     * Find routes that pass near both the initial location and destination
     * Simplified version that focuses on finding any route that passes near both points
     */
    fun findNearbyRoutes(
        allRoutes: List<RouteSearchResult>,
        initialLat: Double,
        initialLon: Double,
        destinationLat: Double,
        destinationLon: Double,
        proximityRadius: Double = 500.0, // Match web version
        onProgress: (Int, Int) -> Unit,
        onComplete: (List<RouteSearchResult>) -> Unit
    ) {
        Log.d(TAG, "Starting findNearbyRoutes with ${allRoutes.size} routes")
        Log.d(TAG, "Initial location: $initialLat, $initialLon")
        Log.d(TAG, "Destination: $destinationLat, $destinationLon")
        Log.d(TAG, "Proximity radius: $proximityRadius meters")

        CoroutineScope(Dispatchers.IO).launch {
            try {
                val results = mutableListOf<RouteSearchResult>()
                var progress = 0
                val totalRoutes = allRoutes.size

                for (route in allRoutes) {
                    progress++
                    withContext(Dispatchers.Main) {
                        onProgress(progress, totalRoutes)
                    }

                    // Skip routes with missing required fields
                    if (route.routeId == null || route.relationId == null || route.routeNumber == null) {
                        Log.e(TAG, "Skipping route with missing required fields: $route")
                        continue
                    }

                    Log.d(TAG, "Checking route ${route.routeNumber} (ID: ${route.relationId})")

                    try {
                        // Get route segments (MultiLineString)
                        val routeSegments = osmRouteParser.parseOsmRouteDataSegments(route.relationId)
                        val routePoints = routeSegments.flatten()

                        if (routePoints.isEmpty()) {
                            Log.w(TAG, "Route ${route.routeNumber} has no points, skipping")
                            continue
                        }

                        Log.d(TAG, "Route ${route.routeNumber} has ${routePoints.size} points in ${routeSegments.size} segments")

                        // Find closest distance to initial point
                        var closestToInitial = Double.MAX_VALUE
                        for (point in routePoints) {
                            val distance = calculateDistance(
                                initialLat, initialLon,
                                point.latitude, point.longitude
                            )
                            if (distance < closestToInitial) {
                                closestToInitial = distance
                            }
                        }

                        // Find closest distance to destination point
                        var closestToDest = Double.MAX_VALUE
                        for (point in routePoints) {
                            val distance = calculateDistance(
                                destinationLat, destinationLon,
                                point.latitude, point.longitude
                            )
                            if (distance < closestToDest) {
                                closestToDest = distance
                            }
                        }

                        val passesNearInitial = closestToInitial <= proximityRadius
                        val passesNearDest = closestToDest <= proximityRadius

                        Log.d(TAG, "Route ${route.routeNumber} passes near initial: $passesNearInitial")
                        Log.d(TAG, "Route ${route.routeNumber} passes near destination: $passesNearDest")

                        if (passesNearInitial && passesNearDest) {
                            Log.d(TAG, "MATCH FOUND! Route ${route.routeNumber} passes near both points")

                            // Calculate travel distance (sum of all segments)
                            var travelDistance = 0.0
                            for (segment in routeSegments) {
                                for (i in 0 until segment.size - 1) {
                                    travelDistance += calculateDistance(
                                        segment[i].latitude,
                                        segment[i].longitude,
                                        segment[i + 1].latitude,
                                        segment[i + 1].longitude
                                    )
                                }
                            }
                            travelDistance /= 1000.0 // Convert to kilometers

                            results.add(
                                RouteSearchResult(
                                    routeId = route.routeId,
                                    relationId = route.relationId,
                                    routeNumber = route.routeNumber,
                                    locations = route.locations,
                                    distance = travelDistance,
                                    routePoints = routePoints,
                                    routeSegments = routeSegments
                                )
                            )
                        }
                    } catch (e: Exception) {
                        Log.e(TAG, "Error processing route ${route.routeNumber}", e)
                        // Continue with next route
                    }
                }

                val sortedResults = results.sortedBy { it.distance }

                Log.d(TAG, "Found ${sortedResults.size} matching routes")
                if (sortedResults.isNotEmpty()) {
                    Log.d(TAG, "Routes found: ${sortedResults.joinToString { it.routeNumber }}")
                }

                withContext(Dispatchers.Main) {
                    onComplete(sortedResults)
                }

            } catch (e: Exception) {
                Log.e(TAG, "Error finding nearby routes", e)
                withContext(Dispatchers.Main) {
                    onComplete(emptyList())
                }
            }
        }
    }

    /**
     * Get route coordinates, using cache if available
     */
    private suspend fun getRouteCoordinates(relationId: String): List<GeoPoint> {
        // Check cache first
        routeCoordinatesCache[relationId]?.let {
            Log.d(TAG, "Using cached coordinates for route $relationId (${it.size} points)")
            return it
        }

        // Fetch from API if not in cache
        try {
            Log.d(TAG, "Fetching coordinates for route $relationId from Overpass API")
            val segments = osmRouteParser.parseOsmRouteDataSegments(relationId)
            val coordinates = segments.flatten()

            Log.d(TAG, "Fetched ${coordinates.size} coordinates for route $relationId")

            // Cache the result
            routeCoordinatesCache[relationId] = coordinates

            return coordinates
        } catch (e: Exception) {
            Log.e(TAG, "Error getting route coordinates for $relationId", e)
            return emptyList()
        }
    }

    /**
     * Calculate distance between two points using the Haversine formula
     */
    private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val earthRadius = 6371000.0 // meters
        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)
        val a = sin(dLat / 2).pow(2) +
                cos(Math.toRadians(lat1)) * cos(Math.toRadians(lat2)) *
                sin(dLon / 2).pow(2)
        val c = 2 * atan2(sqrt(a), sqrt(1 - a))
        return earthRadius * c
    }


    /**
     * Get a specific route by relation ID
     */
    suspend fun getRouteByRelationId(relationId: String): List<GeoPoint> {
        return getRouteCoordinates(relationId)
    }

    /**ret
     * Debug method to log information about a specific route
     */
    suspend fun debugRoute(relationId: String) {
        try {
            Log.d(TAG, "===== DEBUG ROUTE $relationId =====")
            val points = getRouteCoordinates(relationId)
            Log.d(TAG, "Route has ${points.size} points")

            if (points.isNotEmpty()) {
                Log.d(TAG, "First point: ${points.first().latitude}, ${points.first().longitude}")
                Log.d(TAG, "Last point: ${points.last().latitude}, ${points.last().longitude}")

                // Log a few sample points
                val sampleSize = minOf(5, points.size)
                Log.d(TAG, "Sample points:")
                for (i in 0 until sampleSize) {
                    val index = (i * points.size) / sampleSize
                    val point = points[index]
                    Log.d(TAG, "  Point $index: ${point.latitude}, ${point.longitude}")
                }
            }

            Log.d(TAG, "===== END DEBUG ROUTE =====")
        } catch (e: Exception) {
            Log.e(TAG, "Error debugging route", e)
        }
    }

    /**
     * Lookup a jeepney route by route number using the backend API
     */
    suspend fun lookupRouteByNumberSuspend(routeNumber: String): RouteSearchResult? {
        val token = getAuthToken() ?: return null
        return try {
            val response = RetrofitClient.instance.lookupRoute(token, routeNumber).execute()
            if (response.isSuccessful) {
                response.body()
            } else {
                null
            }
        } catch (e: Exception) {
            Log.e(TAG, "Error in lookupRouteByNumberSuspend", e)
            null
        }
    }

    fun lookupRouteByNumber(routeNumber: String, onResult: (RouteSearchResult?) -> Unit) {
        val token = getAuthToken()
        if (token == null) {
            onResult(null)
            return
        }
        RetrofitClient.instance.lookupRoute(token, routeNumber).enqueue(object : Callback<RouteSearchResult> {
            override fun onResponse(call: Call<RouteSearchResult>, response: Response<RouteSearchResult>) {
                if (response.isSuccessful) {
                    onResult(response.body())
                } else {
                    onResult(null)
                }
            }
            override fun onFailure(call: Call<RouteSearchResult>, t: Throwable) {
                Log.e(TAG, "lookupRouteByNumber failed", t)
                onResult(null)
            }
        })
    }
}