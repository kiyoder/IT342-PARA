package com.example.para_mobile

import retrofit2.Call
import retrofit2.http.*

data class RegisterRequest(
    val username: String,
    val email: String,
    val password: String,
    val role: String
)
data class LoginRequest(val username: String, val password: String)
data class LoginResponse(val token: String) // JWT Token response
data class UserProfile(val username: String, val email: String, val role: String)

interface ApiService {
    @POST("api/users/register")
    fun registerUser(@Body request: RegisterRequest): Call<UserProfile>

    @POST("api/users/login")
    fun loginUser(@Body request: LoginRequest): Call<LoginResponse>

    @GET("api/users/profile")
    fun getUserProfile(@Header("Authorization") token: String): Call<UserProfile>
}
