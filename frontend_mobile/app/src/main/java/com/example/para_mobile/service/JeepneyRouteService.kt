package com.example.para_mobile.service

import android.content.Context
import android.util.Log
import com.example.para_mobile.api.ApiService
import com.example.para_mobile.api.OverpassAPI
import com.example.para_mobile.api.OverpassResponse
import com.example.para_mobile.api.RetrofitClient
import com.example.para_mobile.auth.TokenManager
import com.example.para_mobile.model.JeepneyRoute
import com.example.para_mobile.util.RouteOverlay
import org.osmdroid.util.GeoPoint
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class JeepneyRouteService {

    private val TAG = "JeepneyRouteService"

    // Cache for route geometries to avoid repeated API calls
    private val routeGeometryCache = mutableMapOf<String, List<GeoPoint>>()

    fun getAllRoutes(
        token: String,
        context: Context,
        onSuccess: (List<JeepneyRoute>) -> Unit,
        onEmpty: () -> Unit,
        onError: (String) -> Unit
    ) {
        // Make sure to add "Bearer " prefix to the token
        val authToken = if (token.startsWith("Bearer ")) token else "Bearer $token"

        Log.d(TAG, "Fetching routes with token: $authToken")

        RetrofitClient.instance.getAllRoutes(authToken).enqueue(object : Callback<List<JeepneyRoute>> {
            override fun onResponse(call: Call<List<JeepneyRoute>>, response: Response<List<JeepneyRoute>>) {
                if (response.isSuccessful) {
                    response.body()?.let { routes ->
                        Log.d(TAG, "Routes fetched successfully: ${routes.size} routes")
                        if (routes.isNotEmpty()) {
                            onSuccess(routes)
                        } else {
                            onEmpty()
                        }
                    } ?: onError("Empty response")
                } else if (response.code() == 401 || response.code() == 403) {
                    // Token might be expired or invalid, try to refresh it
                    Log.d(TAG, "Token rejected with code ${response.code()}, attempting refresh")
                    val tokenManager = TokenManager(context)
                    tokenManager.refreshToken(
                        onSuccess = { newToken ->
                            // Retry with the new token
                            getAllRoutes(newToken, context, onSuccess, onEmpty, onError)
                        },
                        onError = { refreshError ->
                            onError("Authentication failed: $refreshError")
                        }
                    )
                } else {
                    // Try to parse the error response
                    try {
                        val errorBody = response.errorBody()?.string()
                        Log.e(TAG, "Error response: $errorBody")
                        onError("Server error: ${response.code()} - ${response.message()}")
                    } catch (e: Exception) {
                        Log.e(TAG, "Failed to parse error response", e)
                        onError("Failed to get routes: ${response.code()} - ${response.message()}")
                    }
                }
            }

            override fun onFailure(call: Call<List<JeepneyRoute>>, t: Throwable) {
                Log.e(TAG, "API call failed", t)
                onError(t.message ?: "Unknown error")
            }
        })
    }

    fun fetchRouteGeometry(
        relationId: String,
        routeOverlay: RouteOverlay,
        onRouteLoaded: (List<GeoPoint>) -> Unit,
        onError: (String) -> Unit
    ) {
        // Check if we have this route geometry cached
        if (routeGeometryCache.containsKey(relationId)) {
            val cachedPoints = routeGeometryCache[relationId]!!
            routeOverlay.drawRoute(cachedPoints)
            onRouteLoaded(cachedPoints)
            return
        }

        // Use Overpass API to fetch the route geometry based on the relation ID
        val overpassUrl = "https://overpass-api.de/api/"
        val query = """
            [out:json];
            relation($relationId);
            way(r);
            (._;>;);
            out body;
        """.trimIndent()

        val retrofit = Retrofit.Builder()
            .baseUrl(overpassUrl)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        val overpassApi = retrofit.create(OverpassAPI::class.java)

        overpassApi.getRouteGeometry(query).enqueue(object : Callback<OverpassResponse> {
            override fun onResponse(call: Call<OverpassResponse>, response: Response<OverpassResponse>) {
                if (response.isSuccessful) {
                    response.body()?.let { overpassResponse ->
                        try {
                            // Process the Overpass response to extract route points
                            val routePoints = processOverpassResponse(overpassResponse)

                            if (routePoints.isEmpty()) {
                                onError("No route points found")
                                return
                            }

                            // Cache the route geometry
                            routeGeometryCache[relationId] = routePoints

                            // Draw the route on the map
                            routeOverlay.drawRoute(routePoints)

                            // Return the route points
                            onRouteLoaded(routePoints)
                        } catch (e: Exception) {
                            onError("Failed to process route data: ${e.message}")
                        }
                    } ?: onError("Empty response from Overpass API")
                } else {
                    onError("Failed to get route geometry: ${response.code()}")
                }
            }

            override fun onFailure(call: Call<OverpassResponse>, t: Throwable) {
                onError(t.message ?: "Unknown error")
            }
        })
    }

    private fun processOverpassResponse(response: OverpassResponse): List<GeoPoint> {
        // Create a map of node IDs to GeoPoints
        val nodes = response.elements
            .filter { it.type == "node" }
            .associate { it.id to GeoPoint(it.lat, it.lon) }

        // Get all ways that are part of the relation
        val ways = response.elements
            .filter { it.type == "way" }

        // For Cebu jeepney routes, we need to properly order the ways
        // This is a simplified approach - in a real app, you'd need to handle
        // the correct ordering of ways based on the relation's member roles

        // Collect all node references from the ways in order
        val routePoints = mutableListOf<GeoPoint>()

        for (way in ways) {
            val wayPoints = mutableListOf<GeoPoint>()
            for (nodeId in way.nodes ?: emptyList()) {
                nodes[nodeId]?.let { wayPoints.add(it) }
            }

            // Add the way's points to the route
            if (wayPoints.isNotEmpty()) {
                routePoints.addAll(wayPoints)
            }
        }

        return routePoints
    }
}
