package com.example.para_mobile.api

import com.example.para_mobile.model.RouteSearchResult
import retrofit2.Call
import retrofit2.http.*

data class SignupRequest(
    val username: String,
    val email: String,
    val password: String
)

data class LoginRequest(
    val email: String,
    val password: String
)

interface ApiService {
    // Register User
    @POST("api/auth/signup")
    fun registerUser(@Body request: SignupRequest): Call<Map<String, Any>>

    // Login User
    @POST("api/auth/login")
    fun loginUser(@Body request: LoginRequest): Call<Map<String, String>>

    // Google Authentication
    @POST("api/auth/login-with-google")
    fun loginWithGoogle(@Body request: Map<String, String>): Call<Map<String, String>>

    @POST("api/auth/register-with-google")
    fun registerWithGoogle(@Body request: Map<String, String>): Call<Map<String, Any>>

    // Validate token — still requires manual header
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

    // ✅ Get all jeepney routes
    @GET("api/routes")
    fun getAllRoutes(): Call<List<RouteSearchResult>>

    // ✅ Lookup route by routeNumber (query param)
    @GET("api/routes/lookup")
    fun lookupRoute(
        @Header("Authorization") token: String,
        @Query("routeNumber") routeNumber: String
    ): Call<RouteSearchResult>

    // ✅ Create route
    @POST("api/routes")
    fun createRoute(
        @Header("Authorization") token: String,
        @Body route: RouteSearchResult
    ): Call<RouteSearchResult>

    // ✅ Update route
    @PUT("api/routes/{id}")
    fun updateRoute(
        @Header("Authorization") token: String,
        @Path("id") routeId: Long,
        @Body route: RouteSearchResult
    ): Call<Map<String, Any>>

    // ✅ Delete route
    @DELETE("api/routes/{id}")
    fun deleteRoute(
        @Header("Authorization") token: String,
        @Path("id") routeId: Long
    ): Call<Map<String, Any>>

    // Google OAuth callback
    @GET("api/auth/google-callback")
    fun googleCallback(@Query("code") code: String): Call<Map<String, Any>>
}
