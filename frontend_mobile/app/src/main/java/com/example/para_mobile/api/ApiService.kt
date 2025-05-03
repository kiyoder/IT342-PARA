package com.example.para_mobile.api

import com.example.para_mobile.model.JeepneyRoute
import retrofit2.Call
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.Header
import retrofit2.http.POST
import retrofit2.http.PUT
import retrofit2.http.Query

data class SignupRequest(
    val username: String,
    val email: String,
    val password: String
)

data class LoginRequest(
    val email: String,  // Changed from username to email
    val password: String
)

interface ApiService {
    // Register User - Updated to match backend endpoint
    @POST("api/auth/signup")
    fun registerUser(@Body request: SignupRequest): Call<Map<String, Any>>

    // Login User - Updated to match backend endpoint
    @POST("api/auth/login")
    fun loginUser(@Body request: LoginRequest): Call<Map<String, String>>

    // Google Authentication
    @POST("api/auth/login-with-google")
    fun loginWithGoogle(@Body request: Map<String, String>): Call<Map<String, String>>

    @POST("api/auth/register-with-google")
    fun registerWithGoogle(@Body request: Map<String, String>): Call<Map<String, Any>>

    // Validate token
    @GET("api/auth/validate-token")
    fun validateToken(@Header("Authorization") token: String): Call<Map<String, Any>>

    // Get user profile
    @GET("api/users/profile")
    fun getUserProfile(@Header("Authorization") token: String): Call<Map<String, Any>>

    // Update user profile
    @POST("api/users/profile")
    fun updateUserProfile(
        @Header("Authorization") token: String,
        @Body updates: Map<String, String>
    ): Call<Map<String, Any>>

    // Change password
    @POST("api/users/change-password")
    fun changePassword(
        @Header("Authorization") token: String,
        @Body passwordData: Map<String, String>
    ): Call<Map<String, Any>>

    // Get All Routes
    @GET("api/routes/all")
    fun getAllRoutes(@Header("Authorization") token: String): Call<List<JeepneyRoute>>

    // Lookup Route by route number
    @GET("api/routes/lookup")
    fun lookupRoute(
        @Header("Authorization") token: String,
        @Query("routeNumber") routeNumber: String
    ): Call<JeepneyRoute>
}
