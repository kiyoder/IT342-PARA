package com.example.para_mobile.api

import com.example.para_mobile.model.JeepneyRoute
import retrofit2.Call
import retrofit2.http.GET
import retrofit2.http.Query
import retrofit2.http.Header

interface JeepneyRouteAPI {
    @GET("api/routes/all")
    fun getAllRoutes(@Header("Authorization") token: String): Call<List<JeepneyRoute>>

    @GET("api/routes/lookup")
    fun lookupRoute(
        @Header("Authorization") token: String,
        @Query("routeNumber") routeNumber: String
    ): Call<JeepneyRoute>
}
