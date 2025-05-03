package com.example.para_mobile.api

import retrofit2.Call
import retrofit2.http.GET
import retrofit2.http.Query

interface OverpassAPI {
    @GET("interpreter")
    fun getRouteGeometry(@Query("data") query: String): Call<OverpassResponse>
}

data class OverpassResponse(
    val elements: List<OverpassElement>
)

data class OverpassElement(
    val type: String,
    val id: Long,
    val lat: Double = 0.0,
    val lon: Double = 0.0,
    val nodes: List<Long>? = null,
    val tags: Map<String, String>? = null
)
