package com.example.para_mobile.service

import android.util.Log
import com.example.para_mobile.api.OverpassApi
import com.example.para_mobile.api.OverpassElement
import com.example.para_mobile.api.OverpassResponse
import okhttp3.MediaType.Companion.toMediaTypeOrNull
import okhttp3.RequestBody.Companion.toRequestBody
import org.osmdroid.util.GeoPoint
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException
import kotlin.coroutines.suspendCoroutine

class OSMRouteParser(private val overpassApi: OverpassApi) {
    private val TAG = "OSMRouteParser"

    /**
     * Parse OSM relation data for a given relation ID using Overpass API,
     * extract the ways in order, and stitch together segments without forcing
     * non-adjacent segments to connect. Returns a list of segments (each a list of GeoPoint).
     */
    suspend fun parseOsmRouteDataSegments(relationId: String): List<List<GeoPoint>> = suspendCoroutine { continuation ->
        try {
            val query = """
                [out:json][timeout:25];
                relation($relationId);
                >>;
                out geom;
            """.trimIndent()

            val requestBody = query.toRequestBody("text/plain".toMediaTypeOrNull())

            overpassApi.executeQuery(requestBody).enqueue(object : Callback<OverpassResponse> {
                override fun onResponse(call: Call<OverpassResponse>, response: Response<OverpassResponse>) {
                    if (response.isSuccessful && response.body() != null) {
                        try {
                            val data = response.body()!!
                            Log.d(TAG, "Overpass API response received for relation $relationId")

                            val relation = data.elements.find {
                                it.type == "relation" && it.id.toString() == relationId
                            }

                            if (relation == null) {
                                Log.e(TAG, "Relation not found in Overpass response")
                                continuation.resumeWithException(Exception("Relation not found"))
                                return
                            }

                            val wayMembers = relation.members?.filter { it.type == "way" } ?: emptyList()
                            val segments = mutableListOf<List<GeoPoint>>()

                            for (member in wayMembers) {
                                val way = data.elements.find {
                                    it.type == "way" && it.id == member.ref
                                }
                                if (way != null && way.geometry != null) {
                                    val coords = way.geometry.map { GeoPoint(it.lat, it.lon) }
                                    val finalCoords = if (member.role == "backward") coords.reversed() else coords
                                    segments.add(finalCoords)
                                }
                            }

                            // Merge contiguous segments only
                            val mergedSegments = mutableListOf<List<GeoPoint>>()
                            for (seg in segments) {
                                if (mergedSegments.isEmpty()) {
                                    mergedSegments.add(seg)
                                } else {
                                    val lastSeg = mergedSegments.last()
                                    val lastCoord = lastSeg.last()
                                    val firstCoord = seg.first()
                                    if (arePointsClose(lastCoord, firstCoord)) {
                                        // Merge contiguous segments
                                        mergedSegments[mergedSegments.size - 1] = lastSeg + seg.drop(1)
                                    } else {
                                        mergedSegments.add(seg)
                                    }
                                }
                            }
                            Log.d(TAG, "Processed segments: ${mergedSegments.size}")
                            continuation.resume(mergedSegments)
                        } catch (e: Exception) {
                            Log.e(TAG, "Error processing Overpass data", e)
                            continuation.resumeWithException(e)
                        }
                    } else {
                        val errorBody = response.errorBody()?.string() ?: "Unknown error"
                        Log.e(TAG, "Overpass API error: ${response.code()}, Body: $errorBody")
                        continuation.resumeWithException(Exception("Failed to fetch Overpass data: ${response.code()}"))
                    }
                }
                override fun onFailure(call: Call<OverpassResponse>, t: Throwable) {
                    Log.e(TAG, "Overpass API call failed", t)
                    continuation.resumeWithException(t)
                }
            })
        } catch (e: Exception) {
            Log.e(TAG, "Error in parseOsmRouteDataSegments", e)
            continuation.resumeWithException(e)
        }
    }

    /**
     * Check if two points are close enough to be considered the same
     */
    private fun arePointsClose(p1: GeoPoint, p2: GeoPoint): Boolean {
        val threshold = 0.00001 // Approximately 1 meter at the equator
        return Math.abs(p1.latitude - p2.latitude) < threshold &&
                Math.abs(p1.longitude - p2.longitude) < threshold
    }

    /**
     * Extract only the portion of the route that the user will travel on
     */
    fun extractRelevantRoutePortion(
        routePoints: List<GeoPoint>,
        initialLat: Double,
        initialLon: Double,
        finalLat: Double,
        finalLon: Double
    ): List<GeoPoint> {
        if (routePoints.isEmpty()) return emptyList()

        // Find the closest points on the route to the initial and final locations
        var closestInitialIndex = -1
        var closestFinalIndex = -1
        var minInitialDistance = Double.POSITIVE_INFINITY
        var minFinalDistance = Double.POSITIVE_INFINITY

        for (i in routePoints.indices) {
            val point = routePoints[i]

            // Calculate distance to initial location
            val initialDistance = calculateDistance(
                initialLat, initialLon,
                point.latitude, point.longitude
            )
            if (initialDistance < minInitialDistance) {
                minInitialDistance = initialDistance
                closestInitialIndex = i
            }

            // Calculate distance to final location
            val finalDistance = calculateDistance(
                finalLat, finalLon,
                point.latitude, point.longitude
            )
            if (finalDistance < minFinalDistance) {
                minFinalDistance = finalDistance
                closestFinalIndex = i
            }
        }

        // Ensure we're going in the right direction
        val startIndex = Math.min(closestInitialIndex, closestFinalIndex)
        val endIndex = Math.max(closestInitialIndex, closestFinalIndex)

        // Extract the relevant portion of the route
        return routePoints.subList(startIndex, endIndex + 1)
    }

    /**
     * Calculate distance between two points using the Haversine formula
     */
    private fun calculateDistance(lat1: Double, lon1: Double, lat2: Double, lon2: Double): Double {
        val earthRadius = 6371000.0 // meters

        val dLat = Math.toRadians(lat2 - lat1)
        val dLon = Math.toRadians(lon2 - lon1)

        val a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                Math.sin(dLon / 2) * Math.sin(dLon / 2)

        val c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

        return earthRadius * c
    }
}