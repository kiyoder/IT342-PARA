package com.example.para_mobile.api

import com.example.para_mobile.model.LocationResult
import retrofit2.Call
import retrofit2.http.GET
import retrofit2.http.Query

interface NominatimAPI {
    @GET("search")
    fun searchLocation(
        @Query("q") query: String,
        @Query("format") format: String = "json"
    ): Call<List<LocationResult>>
}


