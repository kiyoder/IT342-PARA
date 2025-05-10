package com.example.para_mobile.api

import okhttp3.RequestBody
import okhttp3.ResponseBody
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.POST

interface OverpassApi {
    @POST("interpreter")
    fun executeQuery(@Body query: RequestBody): Call<OverpassResponse>
}

data class OverpassResponse(
    val version: Double,
    val generator: String,
    val osm3s: OSM3S,
    val elements: List<OverpassElement>
)

data class OSM3S(
    val timestamp_osm_base: String,
    val copyright: String
)

data class OverpassElement(
    val type: String,
    val id: Long,
    val tags: Map<String, String>? = null,
    val members: List<OverpassMember>? = null,
    val geometry: List<OverpassGeometry>? = null,
    val nodes: List<Long>? = null,
    val lat: Double? = null,
    val lon: Double? = null
)

data class OverpassMember(
    val type: String,
    val ref: Long,
    val role: String
)

data class OverpassGeometry(
    val lat: Double,
    val lon: Double
)