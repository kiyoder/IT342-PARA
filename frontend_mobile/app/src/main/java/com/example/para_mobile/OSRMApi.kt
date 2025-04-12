package com.example.para_mobile

import retrofit2.Call
import retrofit2.http.GET
import retrofit2.http.Query

interface OSRMApi {
    @GET("route/v1/driving/{coordinates}")
    fun getRoute(
        @retrofit2.http.Path("coordinates") coordinates: String,
        @Query("overview") overview: String = "full",
        @Query("geometries") geometries: String = "polyline"
    ): Call<OSRMResponse>
}

data class OSRMResponse(
    val code: String,
    val routes: List<Route>
)

data class Route(
    val geometry: String,
    val distance: Double,
    val duration: Double
)