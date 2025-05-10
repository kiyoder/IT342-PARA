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
import androidx.recyclerview.widget.RecyclerView.ViewHolder
import com.example.para_mobile.R
import com.example.para_mobile.adapter.RecentRouteAdapter
import com.example.para_mobile.model.LocationResult
import com.example.para_mobile.model.RecentRoute
import com.google.gson.Gson

class RecentsFragment : Fragment() {

    private lateinit var recyclerView: RecyclerView
    private lateinit var adapter: RecentRouteAdapter
    private lateinit var noRecentsText: TextView
    private var recentRoutes: MutableList<RecentRoute> = mutableListOf()

    private var onRecentLocationListener: ((RecentRoute) -> Unit)? = null

    override fun onCreateView(
        inflater: LayoutInflater, container: ViewGroup?,
        savedInstanceState: Bundle?
    ): View? {
        val view = inflater.inflate(R.layout.fragment_recents, container, false)

        recyclerView = view.findViewById(R.id.recent_locations_recyclerview)
        noRecentsText = view.findViewById(R.id.tv_no_recents)

        // Set up RecyclerView
        recyclerView.layoutManager = LinearLayoutManager(context)
        adapter = RecentRouteAdapter(recentRoutes) { route -> onRecentLocationListener?.invoke(route) }
        recyclerView.adapter = adapter

        // Load recent routes
        loadRecentRoutes()

        return view
    }

    fun setOnRecentLocationListener(listener: (RecentRoute) -> Unit) {
        onRecentLocationListener = listener
    }

    private fun saveRecentRoute(route: RecentRoute) {
        val userId = requireContext().getSharedPreferences("app_prefs", Context.MODE_PRIVATE).getString("user_id", null)
        val prefs = requireContext().getSharedPreferences("recents_$userId", Context.MODE_PRIVATE)
        val editor = prefs.edit()
        val gson = Gson()
        val recentSet = prefs.getStringSet("routes", mutableSetOf())?.toMutableSet() ?: mutableSetOf()
        val json = gson.toJson(route)
        recentSet.removeIf { it.contains(route.destName) } // prevent duplicates by destination
        recentSet.add(json)
        val trimmed = recentSet.toList().takeLast(5).toSet()
        editor.putStringSet("routes", trimmed)
        editor.apply()
        loadRecentRoutes()
    }

    private fun loadRecentRoutes() {
        val userId = requireContext().getSharedPreferences("app_prefs", Context.MODE_PRIVATE).getString("user_id", null)
        val prefs = requireContext().getSharedPreferences("recents_$userId", Context.MODE_PRIVATE)
        val gson = Gson()
        val recentSet = prefs.getStringSet("routes", emptySet())?.toList()?.reversed() ?: listOf()
        val loadedRoutes = recentSet.mapNotNull { json ->
            try { gson.fromJson(json, RecentRoute::class.java) } catch (e: Exception) { null }
        }
        recentRoutes.clear()
        recentRoutes.addAll(loadedRoutes)
        adapter.notifyDataSetChanged()
        updateEmptyState()
    }

    private fun updateEmptyState() {
        if (recentRoutes.isEmpty()) {
            noRecentsText.visibility = View.VISIBLE
            recyclerView.visibility = View.GONE
        } else {
            noRecentsText.visibility = View.GONE
            recyclerView.visibility = View.VISIBLE
        }
    }

    fun refreshRecents() {
        loadRecentRoutes()
    }

    // Public method to add a route from outside the fragment
    fun addRoute(route: RecentRoute) {
        saveRecentRoute(route)
    }
}
