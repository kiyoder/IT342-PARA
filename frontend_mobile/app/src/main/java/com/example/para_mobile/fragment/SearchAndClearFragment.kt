package com.example.para_mobile.fragment

import android.content.Context
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.text.Editable
import android.text.TextWatcher
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.para_mobile.R
import com.example.para_mobile.adapter.LocationAdapter
import com.example.para_mobile.api.NominatimAPI
import com.example.para_mobile.api.OSRMApi
import com.example.para_mobile.api.RetrofitClient
import com.example.para_mobile.model.LocationResult
import com.google.gson.Gson
import okhttp3.Interceptor
import okhttp3.OkHttpClient
import retrofit2.Call
import retrofit2.Callback
import retrofit2.Response
import retrofit2.Retrofit
import retrofit2.converter.gson.GsonConverterFactory
import java.util.concurrent.TimeUnit
import java.util.concurrent.atomic.AtomicInteger

class SearchAndClearFragment : Fragment() {

    private lateinit var searchEditText: EditText
    private lateinit var voiceSearchButton: ImageView
    private lateinit var clearRouteButton: Button
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: LocationAdapter

    private var recentLocations: MutableList<LocationResult> = mutableListOf()

    private var onSearchListener: ((String, Double, Double) -> Unit)? = null
    private var onVoiceSearchListener: (() -> Unit)? = null
    private var onClearRouteListener: (() -> Unit)? = null
    private var onRecentLocationUpdateListener: (() -> Unit)? = null

    // API call counters
    private val nominatimCallCounter = AtomicInteger(0)
    private val osrmCallCounter = AtomicInteger(0)
    // Last reset time for counters
    private var lastResetTime = System.currentTimeMillis()

    // Debounce variables
    private val searchHandler = Handler(Looper.getMainLooper())
    private var searchRunnable: Runnable? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_search_and_clear, container, false)

        searchEditText = view.findViewById(R.id.search_edit_text)
        voiceSearchButton = view.findViewById(R.id.voice_search_button)
        clearRouteButton = view.findViewById(R.id.clear_route_button)
        recyclerView = view.findViewById(R.id.suggestions_recyclerview)

        adapter = LocationAdapter(emptyList()) { selectedLocation ->
            saveRecentLocation(selectedLocation)
            searchEditText.setText(selectedLocation.display_name)
            recyclerView.visibility = View.GONE
            onSearchListener?.invoke(
                selectedLocation.display_name,
                selectedLocation.lat.toDouble(),
                selectedLocation.lon.toDouble()
            )
            onRecentLocationUpdateListener?.invoke()
        }

        recyclerView.layoutManager = LinearLayoutManager(context)
        recyclerView.adapter = adapter

        setupListeners()

        return view
    }

    private fun setupListeners() {
        searchEditText.addTextChangedListener(object : TextWatcher {
            override fun beforeTextChanged(s: CharSequence?, start: Int, count: Int, after: Int) {}

            override fun onTextChanged(s: CharSequence?, start: Int, before: Int, count: Int) {
                val query = s.toString().trim()

                // Cancel any pending search
                searchRunnable?.let { searchHandler.removeCallbacks(it) }

                if (query.isEmpty()) {
                    recyclerView.visibility = View.GONE
                    adapter.updateData(emptyList())
                    return
                }

                // Debounce: wait 500ms before firing API call
                searchRunnable = Runnable {
                    recyclerView.visibility = View.VISIBLE
                    searchLocations(query)
                }
                searchHandler.postDelayed(searchRunnable!!, 500)
            }

            override fun afterTextChanged(s: Editable?) {}
        })

        voiceSearchButton.setOnClickListener {
            onVoiceSearchListener?.invoke()
        }

        clearRouteButton.setOnClickListener {
            clearSearchText()
            onClearRouteListener?.invoke()
        }
    }

    private fun searchLocations(query: String) {
        RetrofitClient.nominatimApi.searchLocation(query).enqueue(object :
            Callback<List<LocationResult>> {
            override fun onResponse(
                call: Call<List<LocationResult>>,
                response: Response<List<LocationResult>>
            ) {
                if (response.isSuccessful && response.body() != null) {
                    val suggestions = response.body()!!
                    adapter.updateData(suggestions)
                    recyclerView.visibility = if (suggestions.isEmpty()) View.GONE else View.VISIBLE
                } else {
                    adapter.updateData(emptyList())
                    recyclerView.visibility = View.GONE
                }
            }

            override fun onFailure(call: Call<List<LocationResult>>, t: Throwable) {
                t.printStackTrace()
                adapter.updateData(emptyList())
                recyclerView.visibility = View.GONE
            }
        })
    }

    private fun saveRecentLocation(location: LocationResult) {
        val prefs = requireContext().getSharedPreferences("recents", Context.MODE_PRIVATE)
        val gson = Gson()

        val jsonList = prefs.getStringSet("locations", emptySet())?.toMutableList() ?: mutableListOf()
        val currentList = jsonList.mapNotNull {
            try {
                gson.fromJson(it, LocationResult::class.java)
            } catch (e: Exception) {
                null
            }
        }.toMutableList()

        currentList.removeAll { it.display_name == location.display_name }
        currentList.add(location)

        val trimmed = currentList.takeLast(3)
        val updatedJsonSet = trimmed.map { gson.toJson(it) }.toSet()
        prefs.edit().putStringSet("locations", updatedJsonSet).apply()
    }

    fun getRecentLocations(context: Context): List<LocationResult> {
        val prefs = context.getSharedPreferences("recents", Context.MODE_PRIVATE)
        val gson = Gson()
        val jsonList = prefs.getStringSet("locations", emptySet())?.toList() ?: emptyList()

        return jsonList.mapNotNull {
            try {
                gson.fromJson(it, LocationResult::class.java)
            } catch (e: Exception) {
                null
            }
        }
    }

    // Create a custom interceptor to monitor API calls and rate limits
    private val apiMonitorInterceptor = Interceptor { chain ->
        val request = chain.request()
        val url = request.url.toString()

        // Identify which API is being called
        val isOsrm = url.contains("router.project-osrm.org")
        val isNominatim = url.contains("nominatim.openstreetmap.org")

        // Increment the appropriate counter
        if (isOsrm) {
            osrmCallCounter.incrementAndGet()
            Log.d("ApiMonitor", "OSRM API call #${osrmCallCounter.get()} - URL: $url")
        } else if (isNominatim) {
            nominatimCallCounter.incrementAndGet()
            Log.d("ApiMonitor", "Nominatim API call #${nominatimCallCounter.get()} - URL: $url")
        }

        // Reset counters if it's been more than an hour
        val currentTime = System.currentTimeMillis()
        if (currentTime - lastResetTime > 3600000) { // 1 hour in milliseconds
            Log.d("ApiMonitor", "Resetting API counters. OSRM: ${osrmCallCounter.get()}, Nominatim: ${nominatimCallCounter.get()}")
            osrmCallCounter.set(0)
            nominatimCallCounter.set(0)
            lastResetTime = currentTime
        }

        // Proceed with the request
        val response = chain.proceed(request)

        // Check for rate limit headers
        val rateLimitRemaining = response.header("X-Rate-Limit-Remaining")
        val rateLimitReset = response.header("X-Rate-Limit-Reset")

        if (rateLimitRemaining != null) {
            Log.d("ApiMonitor", "Rate limit remaining: $rateLimitRemaining, Reset: $rateLimitReset")

            // Alert if we're getting close to the limit
            if (rateLimitRemaining.toIntOrNull() ?: 1000 < 10) {
                Log.w("ApiMonitor", "WARNING: Approaching API rate limit! Remaining: $rateLimitRemaining")
            }
        }

        // Check for specific error codes that might indicate rate limiting
        if (response.code == 429) {
            Log.e("ApiMonitor", "RATE LIMIT EXCEEDED! API: ${if (isOsrm) "OSRM" else if (isNominatim) "Nominatim" else "Unknown"}")
        }

        response
    }

    private val okHttpClient = OkHttpClient.Builder()
        .connectTimeout(60, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(60, TimeUnit.SECONDS)
        .addInterceptor(apiMonitorInterceptor) // Add our monitoring interceptor
        .build()

    private val nominatimRetrofit = Retrofit.Builder()
        .baseUrl("https://nominatim.openstreetmap.org/")
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val osrmRetrofit = Retrofit.Builder()
        .baseUrl("https://router.project-osrm.org/")
        .client(okHttpClient)
        .addConverterFactory(GsonConverterFactory.create())
        .build()

    private val nominatimApi = nominatimRetrofit.create(NominatimAPI::class.java)
    private val routingApi = osrmRetrofit.create(OSRMApi::class.java)

    // Add a method to get the current API usage stats
    fun getApiUsageStats(): String {
        return "API Usage (since ${java.util.Date(lastResetTime)}):\n" +
                "OSRM API calls: ${osrmCallCounter.get()}\n" +
                "Nominatim API calls: ${nominatimCallCounter.get()}"
    }


    fun setSearchText(text: String) {
        searchEditText.setText(text)
    }

    fun focusSearchField() {
        searchEditText.requestFocus()
    }

    fun setOnClearRouteListener(listener: () -> Unit) {
        onClearRouteListener = listener
    }

    fun setOnVoiceSearchListener(listener: () -> Unit) {
        onVoiceSearchListener = listener
    }

    fun setOnSearchListener(listener: (String, Double, Double) -> Unit) {
        onSearchListener = listener
    }

    fun setOnRecentLocationUpdateListener(listener: () -> Unit) {
        onRecentLocationUpdateListener = listener
    }

    fun clearSearchText() {
        searchEditText.setText("")
    }

    override fun onPause() {
        super.onPause()
        searchRunnable?.let { searchHandler.removeCallbacks(it) }
    }
}
