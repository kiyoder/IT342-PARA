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
import android.view.inputmethod.EditorInfo
import android.widget.Button
import android.widget.EditText
import android.widget.ImageView
import androidx.core.widget.doOnTextChanged
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

    private lateinit var initialLocationEditText: EditText
    private lateinit var destinationEditText: EditText
    private lateinit var swapButton: ImageView
    private lateinit var clearRouteButton: Button
    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: LocationAdapter

    private var recentLocations: MutableList<LocationResult> = mutableListOf()

    private var onSearchListener: ((String, Double, Double, String, Double, Double) -> Unit)? = null
    private var onVoiceSearchListener: (() -> Unit)? = null
    private var onClearRouteListener: (() -> Unit)? = null
    private var onRecentLocationUpdateListener: (() -> Unit)? = null
    private var onDirectRouteRequested: ((Double, Double, Double, Double) -> Unit)? = null

    // API call counters
    private val nominatimCallCounter = AtomicInteger(0)
    private val osrmCallCounter = AtomicInteger(0)
    // Last reset time for counters
    private var lastResetTime = System.currentTimeMillis()

    // Debounce variables
    private val searchHandler = Handler(Looper.getMainLooper())
    private var searchRunnable: Runnable? = null

    // Callback for requesting current location from the activity
    interface OnRequestCurrentLocationListener {
        fun onRequestCurrentLocation(callback: (org.osmdroid.util.GeoPoint) -> Unit)
    }
    private var requestCurrentLocationListener: OnRequestCurrentLocationListener? = null

    private val CEBU_VIEWBOX = "123.82,10.24,124.00,10.40"
    private val BOUNDED = 1

    // Add a callback to open the bottom sheet
    private var onRequestExpandBottomSheet: (() -> Unit)? = null
    fun setOnRequestExpandBottomSheetListener(listener: () -> Unit) {
        onRequestExpandBottomSheet = listener
    }

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_search_and_clear, container, false)

        initialLocationEditText = view.findViewById(R.id.initialLocation)
        destinationEditText = view.findViewById(R.id.destinationInput)
        swapButton = view.findViewById(R.id.swapButton)
        clearRouteButton = view.findViewById(R.id.clear_route_button)
        recyclerView = view.findViewById(R.id.suggestions_recyclerview)

        adapter = LocationAdapter(emptyList()) { selectedLocation ->
            if (selectedLocation.place_id == -1L && selectedLocation.display_name == "Use current location") {
                // Use callback to request current location from activity
                requestCurrentLocationListener?.onRequestCurrentLocation { geoPoint ->
                    initialLocationEditText.setText("Current Location")
                    initialLocationEditText.tag = geoPoint // store GeoPoint for later
                }
            } else {
                if (recyclerView.visibility == View.VISIBLE && initialLocationEditText.isFocused) {
                    initialLocationEditText.setText(selectedLocation.display_name)
                    initialLocationEditText.tag = null // clear tag if not current location
                } else if (recyclerView.visibility == View.VISIBLE && destinationEditText.isFocused) {
                    destinationEditText.setText(selectedLocation.display_name)
                }
            }
            recyclerView.visibility = View.GONE
            geocodeBothAndSearch()
            onRecentLocationUpdateListener?.invoke()
        }

        recyclerView.layoutManager = LinearLayoutManager(context)
        recyclerView.adapter = adapter

        swapButton.setOnClickListener {
            val temp = initialLocationEditText.text.toString()
            initialLocationEditText.setText(destinationEditText.text.toString())
            destinationEditText.setText(temp)
        }

        // Show suggestions for both fields
        initialLocationEditText.doOnTextChanged { text, _, _, _ ->
            showInitialLocationSuggestions(text?.toString() ?: "")
        }
        destinationEditText.doOnTextChanged { text, _, _, _ ->
            showDestinationSuggestions(text?.toString() ?: "")
        }

        // Show 'Use current location' suggestion immediately when focused
        initialLocationEditText.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                showInitialLocationSuggestions(initialLocationEditText.text?.toString() ?: "")
            } else if (!destinationEditText.isFocused) {
                recyclerView.visibility = View.GONE
            }
        }
        destinationEditText.setOnFocusChangeListener { _, hasFocus ->
            if (hasFocus) {
                showDestinationSuggestions(destinationEditText.text?.toString() ?: "")
            } else if (!initialLocationEditText.isFocused) {
                recyclerView.visibility = View.GONE
            }
        }

        // Handle search action on destination input
        destinationEditText.setOnEditorActionListener { _, actionId, _ ->
            if (actionId == EditorInfo.IME_ACTION_DONE) {
                geocodeBothAndSearch()
                true
            } else false
        }

        initialLocationEditText.setOnClickListener {
            onRequestExpandBottomSheet?.invoke()
        }
        destinationEditText.setOnClickListener {
            onRequestExpandBottomSheet?.invoke()
        }

        setupListeners()

        return view
    }

    private fun setupListeners() {
        clearRouteButton.setOnClickListener {
            clearSearchText()
            initialLocationEditText.setText("")
            onClearRouteListener?.invoke()
        }
    }

    private fun showInitialLocationSuggestions(query: String) {
        val suggestions = mutableListOf<LocationResult>()
        // Add a fake LocationResult for 'Use current location'
        suggestions.add(LocationResult(-1, "", "", -1, 0.0, 0.0, "Use current location", "", 1.0, com.example.para_mobile.model.Address(null,null,null,null,null,null,null,null)))
        if (query.isNotEmpty()) {
            RetrofitClient.nominatimApi.searchLocation(query, viewbox = CEBU_VIEWBOX, bounded = BOUNDED).enqueue(object : Callback<List<LocationResult>> {
                override fun onResponse(call: Call<List<LocationResult>>, response: Response<List<LocationResult>>) {
                    if (response.isSuccessful && response.body() != null) {
                        suggestions.addAll(response.body()!!)
                    }
                    adapter.updateData(suggestions)
                    recyclerView.visibility = if (suggestions.isEmpty()) View.GONE else View.VISIBLE
                }
                override fun onFailure(call: Call<List<LocationResult>>, t: Throwable) {
                    adapter.updateData(suggestions)
                    recyclerView.visibility = if (suggestions.isEmpty()) View.GONE else View.VISIBLE
                }
            })
        } else {
            adapter.updateData(suggestions)
            recyclerView.visibility = if (suggestions.isEmpty()) View.GONE else View.VISIBLE
        }
    }

    private fun showDestinationSuggestions(query: String) {
        if (query.isNotEmpty()) {
            RetrofitClient.nominatimApi.searchLocation(query, viewbox = CEBU_VIEWBOX, bounded = BOUNDED).enqueue(object : Callback<List<LocationResult>> {
                override fun onResponse(call: Call<List<LocationResult>>, response: Response<List<LocationResult>>) {
                    if (response.isSuccessful && response.body() != null) {
                        adapter.updateData(response.body()!!)
                        recyclerView.visibility = if (response.body()!!.isEmpty()) View.GONE else View.VISIBLE
                    }
                }
                override fun onFailure(call: Call<List<LocationResult>>, t: Throwable) {
                    adapter.updateData(emptyList())
                    recyclerView.visibility = View.GONE
                }
            })
        } else {
            adapter.updateData(emptyList())
            recyclerView.visibility = View.GONE
        }
    }

    private fun saveRecentRoute(
        initialName: String, initialLat: Double, initialLon: Double,
        destName: String, destLat: Double, destLon: Double
    ) {
        val userId = requireContext().getSharedPreferences("app_prefs", Context.MODE_PRIVATE).getString("user_id", null)
        val prefs = requireContext().getSharedPreferences("recents_$userId", Context.MODE_PRIVATE)
        val gson = Gson()
        val jsonList = prefs.getStringSet("routes", emptySet())?.toMutableList() ?: mutableListOf()
        val currentList = jsonList.mapNotNull {
            try { gson.fromJson(it, com.example.para_mobile.model.RecentRoute::class.java) } catch (e: Exception) { null }
        }.toMutableList()
        currentList.removeAll { it.destName == destName }
        currentList.add(com.example.para_mobile.model.RecentRoute(initialName, initialLat, initialLon, destName, destLat, destLon))
        val trimmed = currentList.takeLast(5)
        val updatedJsonSet = trimmed.map { gson.toJson(it) }.toSet()
        prefs.edit().putStringSet("routes", updatedJsonSet).apply()
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
        destinationEditText.setText(text)
    }

    fun focusSearchField() {
        destinationEditText.requestFocus()
    }

    fun setOnClearRouteListener(listener: () -> Unit) {
        onClearRouteListener = listener
    }

    fun setOnRecentLocationUpdateListener(listener: () -> Unit) {
        onRecentLocationUpdateListener = listener
    }

    fun clearSearchText() {
        destinationEditText.setText("")
    }

    override fun onPause() {
        super.onPause()
        searchRunnable?.let { searchHandler.removeCallbacks(it) }
    }

    private fun geocodeBothAndSearch() {
        val initialQuery = initialLocationEditText.text.toString().trim()
        val destQuery = destinationEditText.text.toString().trim()
        val initialGeoPoint = initialLocationEditText.tag as? org.osmdroid.util.GeoPoint
        // Hide suggestions after search is triggered
        recyclerView.visibility = View.GONE
        if (initialGeoPoint != null && initialQuery == "Current Location") {
            // Use current location directly
            geocodeDestinationAndSearch(initialGeoPoint.latitude, initialGeoPoint.longitude, destQuery)
            return
        }
        if (initialQuery.isEmpty() || destQuery.isEmpty()) {
            return
        }
        RetrofitClient.nominatimApi.searchLocation(initialQuery).enqueue(object : Callback<List<LocationResult>> {
            override fun onResponse(call: Call<List<LocationResult>>, response: Response<List<LocationResult>>) {
                val initialResults = response.body()
                if (!response.isSuccessful || initialResults.isNullOrEmpty()) {
                    return
                }
                val initial = initialResults[0]
                geocodeDestinationAndSearch(initial.lat, initial.lon, destQuery)
            }
            override fun onFailure(call: Call<List<LocationResult>>, t: Throwable) {
            }
        })
    }

    private fun geocodeDestinationAndSearch(initialLat: Double, initialLon: Double, destQuery: String) {
        RetrofitClient.nominatimApi.searchLocation(destQuery).enqueue(object : Callback<List<LocationResult>> {
            override fun onResponse(call: Call<List<LocationResult>>, response: Response<List<LocationResult>>) {
                val destResults = response.body()
                if (!response.isSuccessful || destResults.isNullOrEmpty()) {
                    return
                }
                val dest = destResults[0]
                // Call direct route callback before showing jeepney routes
                onDirectRouteRequested?.invoke(initialLat, initialLon, dest.lat, dest.lon)
                onSearchListener?.invoke(
                    initialLocationEditText.text.toString(),
                    initialLat,
                    initialLon,
                    dest.display_name,
                    dest.lat,
                    dest.lon
                )
                // Save the recent route
                saveRecentRoute(
                    initialLocationEditText.text.toString(),
                    initialLat,
                    initialLon,
                    dest.display_name,
                    dest.lat,
                    dest.lon
                )
            }
            override fun onFailure(call: Call<List<LocationResult>>, t: Throwable) {
            }
        })
    }

    override fun onAttach(context: Context) {
        super.onAttach(context)
        if (context is OnRequestCurrentLocationListener) {
            requestCurrentLocationListener = context
        }
    }

    override fun onDetach() {
        super.onDetach()
        requestCurrentLocationListener = null
    }

    fun setOnSearchListener(listener: (String, Double, Double, String, Double, Double) -> Unit) {
        onSearchListener = listener
    }

    fun setOnDirectRouteRequestedListener(listener: (Double, Double, Double, Double) -> Unit) {
        onDirectRouteRequested = listener
    }

    // Utility method to hide suggestions programmatically
    fun hideSuggestions() {
        recyclerView.visibility = View.GONE
    }

    // Add this method to set both fields and trigger search
    fun setInitialAndDestination(
        initialName: String, initialLat: Double, initialLon: Double,
        destName: String, destLat: Double, destLon: Double
    ) {
        initialLocationEditText.setText(initialName)
        initialLocationEditText.tag = org.osmdroid.util.GeoPoint(initialLat, initialLon)
        destinationEditText.setText(destName)
        geocodeBothAndSearch()
    }
}
