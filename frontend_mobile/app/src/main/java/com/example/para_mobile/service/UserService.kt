package com.example.para_mobile.service

import com.example.para_mobile.api.ApiService
import okhttp3.OkHttpClient
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory

class UserService(private val token: String) {

    private val api: ApiService

    init {
        val client = OkHttpClient.Builder()
            .addInterceptor { chain ->
                val newRequest = chain.request().newBuilder()
                    .addHeader("Authorization", "Bearer $token")
                    .build()
                chain.proceed(newRequest)
            }
            .build()

        val retrofit = Retrofit.Builder()
            .baseUrl("https://para-monorepo-c523fc091002.herokuapp.com/")
            .client(client)
            .addConverterFactory(GsonConverterFactory.create())
            .build()

        api = retrofit.create(ApiService::class.java)
    }

    fun getProfile() = api.getUserProfile(token)
    fun updateProfile(updates: Map<String, String>) = api.updateUserProfile(token, updates)
    fun changePassword(passwordData: Map<String, String>) = api.changePassword(token, passwordData)
    fun getAllRoutes() = api.getAllRoutes()
    fun lookupRoute(routeNumber: String) = api.lookupRoute(token, routeNumber)
}
