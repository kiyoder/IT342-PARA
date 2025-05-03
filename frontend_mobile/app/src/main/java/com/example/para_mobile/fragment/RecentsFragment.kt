package com.example.para_mobile.fragment

import android.content.Context
import android.os.Bundle
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.TextView
import androidx.fragment.app.Fragment
import androidx.recyclerview.widget.LinearLayoutManager
import androidx.recyclerview.widget.RecyclerView
import com.example.para_mobile.R
import com.example.para_mobile.adapter.RecentLocationAdapter
import com.example.para_mobile.model.LocationResult
import com.google.gson.Gson

class RecentsFragment : Fragment() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: RecentLocationAdapter
    private lateinit var noRecentsText: TextView
    private var recentLocations: MutableList<LocationResult> = mutableListOf()

    private var onRecentLocationListener: ((String) -> Unit)? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_recents, container, false)

        recyclerView = view.findViewById(R.id.recent_locations_recyclerview)
        noRecentsText = view.findViewById(R.id.tv_no_recents)

        // Set up RecyclerView
        recyclerView.layoutManager = LinearLayoutManager(context)
        adapter = RecentLocationAdapter(
            recentLocations,
            onClick = { selected ->
                onRecentLocationListener?.invoke(selected.display_name)
            },
            onDelete = { locationToDelete ->
                deleteRecentLocation(locationToDelete)
            }
        )
        recyclerView.adapter = adapter

        // Load recent locations
        loadRecentLocations()

        return view
    }

    fun setOnRecentLocationListener(listener: (String) -> Unit) {
        onRecentLocationListener = listener
    }

    private fun saveRecentLocation(location: LocationResult) {
        val prefs = requireContext().getSharedPreferences("recents", Context.MODE_PRIVATE)
        val editor = prefs.edit()

        val gson = Gson()
        val recentSet = prefs.getStringSet("locations", mutableSetOf())?.toMutableSet() ?: mutableSetOf()

        val json = gson.toJson(location)
        recentSet.removeIf { it.contains(location.display_name) } // prevent duplicates
        recentSet.add(json)

        // Optional: limit to 5 most recent
        val trimmed = recentSet.toList().takeLast(5).toSet()

        editor.putStringSet("locations", trimmed)
        editor.apply()

        // Refresh the list
        loadRecentLocations()
    }

    private fun deleteRecentLocation(location: LocationResult) {
        val prefs = requireContext().getSharedPreferences("recents", Context.MODE_PRIVATE)
        val editor = prefs.edit()

        val gson = Gson()
        val recentSet = prefs.getStringSet("locations", mutableSetOf())?.toMutableSet() ?: mutableSetOf()

        // Find and remove the location
        val toRemove = recentSet.find { json ->
            try {
                val loc = gson.fromJson(json, LocationResult::class.java)
                loc.place_id == location.place_id
            } catch (e: Exception) {
                false
            }
        }

        if (toRemove != null) {
            recentSet.remove(toRemove)
            editor.putStringSet("locations", recentSet)
            editor.apply()

            // Refresh the list
            loadRecentLocations()
        }
    }

    // Optional: expose this to allow external update (e.g., after new location is added)
    fun updateRecents(newList: List<LocationResult>) {
        recentLocations.clear()
        recentLocations.addAll(newList)
        adapter.updateData(recentLocations)
        updateEmptyState()
    }

    private fun loadRecentLocations() {
        val prefs = requireContext().getSharedPreferences("recents", Context.MODE_PRIVATE)
        val gson = Gson()

        val recentSet = prefs.getStringSet("locations", emptySet())?.toList()?.reversed() ?: listOf()

        val loadedLocations = recentSet.mapNotNull { json ->
            try {
                gson.fromJson(json, LocationResult::class.java)
            } catch (e: Exception) {
                null // skip malformed entries
            }
        }

        recentLocations.clear()
        recentLocations.addAll(loadedLocations)
        adapter.updateData(recentLocations)
        updateEmptyState()
    }

    private fun updateEmptyState() {
        if (recentLocations.isEmpty()) {
            noRecentsText.visibility = View.VISIBLE
            recyclerView.visibility = View.GONE
        } else {
            noRecentsText.visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
        }
    }

    fun refreshRecents() {
        loadRecentLocations()
    }

    // Public method to add a location from outside the fragment
    fun addLocation(location: LocationResult) {
        saveRecentLocation(location)
    }
}
