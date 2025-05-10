package com.example.para_mobile.util

import android.content.Context
import com.example.para_mobile.api.RetrofitClient

object AuthUtil {
    fun saveAuthToken(context: Context, accessToken: String) {
        val token = if (accessToken.startsWith("Bearer ")) accessToken else "Bearer $accessToken"
        val sharedPref = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        sharedPref.edit().putString("jwt_token", token).apply()
        RetrofitClient.setAuthToken(token)
    }
} 