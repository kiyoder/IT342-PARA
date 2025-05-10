package com.example.para_mobile.util

import android.content.Context
import android.util.Log
import com.example.para_mobile.api.RetrofitClient

object AuthUtil {
    fun saveAuthToken(context: Context, accessToken: String) {


        // Ensure we're not double-prefixing "Bearer"
        val token = accessToken.removePrefix("Bearer ").trim()
        val sharedPref = context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE)
        sharedPref.edit().apply {
            putString("jwt_token", token)
            apply()
        }
        RetrofitClient.setAuthToken(token)
        Log.d("AuthUtil", "Saved and set auth token: ${token.take(10)}...")

    }
} 