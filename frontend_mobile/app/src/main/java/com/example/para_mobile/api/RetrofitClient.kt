package com.example.para_mobile.api

import okhttp3.OkHttpClient
import okhttp3.logging.HttpLoggingInterceptor
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import android.util.Log
import com.google.gson.GsonBuilder
import android.content.Context

object RetrofitClient {
    private const val BASE_URL = "https://para-monorepo-c523fc091002.herokuapp.com/"
    private const val NOMINATIM_URL = "https://nominatim.openstreetmap.org/"
    private const val SUPABASE_API_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZWVsb2VxbHpuamdra2planB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxODY3MzMsImV4cCI6MjA1OTc2MjczM30.x2ywW2R20yE6vFEdZ5-X0Ueqs5htUiUYUALf-cNOH5E"

    private var authToken: String? = null

    // Set the auth token
    fun setAuthToken(token: String) {
        authToken = token
    }

    private val loggingInterceptor = HttpLoggingInterceptor().apply {
        level = HttpLoggingInterceptor.Level.BODY
    }

    private fun getSupabaseUid(context: Context): String? {
        return context.getSharedPreferences("app_prefs", Context.MODE_PRIVATE).getString("supabase_uid", null)
    }

    private val okHttpClient: OkHttpClient
        get() = OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .addInterceptor { chain ->
                val builder = chain.request().newBuilder()
                authToken?.let {
                    val formattedToken = if (!it.startsWith("Bearer ")) "Bearer $it" else it
                    Log.d("RetrofitClient", "Adding Authorization header: $formattedToken")
                    builder.addHeader("Authorization", formattedToken)
                }
                // Add Supabase apikey header to all requests
                builder.addHeader("apikey", SUPABASE_API_KEY)
                builder.addHeader("Content-Type", "application/json")
                builder.addHeader("Accept", "application/json")

//                // Add id header if available
//                val context = com.example.para_mobile.ParaMobileApp.instance.applicationContext
//                val supabaseUid = getSupabaseUid(context)
//                if (!supabaseUid.isNullOrEmpty()) {
//                    builder.addHeader("id", supabaseUid)
//                }

                chain.proceed(builder.build())
            }
            .connectTimeout(30, TimeUnit.SECONDS)
            .readTimeout(30, TimeUnit.SECONDS)
            .writeTimeout(30, TimeUnit.SECONDS)
            .build()

    private val retrofit: Retrofit
        get() = Retrofit.Builder()
            .baseUrl(BASE_URL)
            .client(okHttpClient)
            .addConverterFactory(GsonConverterFactory.create(GsonBuilder().setLenient().create()))
            .build()

    val instance: ApiService
        get() = retrofit.create(ApiService::class.java)

    val nominatimApi: NominatimAPI = Retrofit.Builder()
        .baseUrl(NOMINATIM_URL)
        .client(OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .header("User-Agent", "ParaMobile_App")
                    .build()
                chain.proceed(request)
            }
            .build())
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(NominatimAPI::class.java)

    // Add this to your existing RetrofitClient.kt file
    private const val OVERPASS_URL = "https://overpass-api.de/api/"

    val overpassApi: OverpassApi = Retrofit.Builder()
        .baseUrl(OVERPASS_URL)
        .client(OkHttpClient.Builder()
            .addInterceptor(loggingInterceptor)
            .addInterceptor { chain ->
                val request = chain.request().newBuilder()
                    .header("User-Agent", "ParaMobile_App")
                    .build()
                chain.proceed(request)
            }
            .build())
        .addConverterFactory(GsonConverterFactory.create())
        .build()
        .create(OverpassApi::class.java)
}
