package com.example.para_mobile

import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import okhttp3.logging.HttpLoggingInterceptor

object RetrofitClient {
    private const val BASE_URL = "http://10.0.2.2:8080/"  // backend IP

    private val interceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private val client = OkHttpClient.Builder().addInterceptor(interceptor).build()

    val instance: ApiService by lazy {
        Retrofit.Builder()
            .baseUrl(BASE_URL)
            .addConverterFactory(GsonConverterFactory.create())
            .client(client)
            .build()
            .create(ApiService::class.java)
    }

    private val osrmRetrofit = Retrofit.Builder()
        .baseUrl("https://router.project-osrm.org/")
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val routingApi = osrmRetrofit.create(OSRMApi::class.java)
    private lateinit var routeOverlay: RouteOverlay
}
