package com.example.para_mobile.adapter

import android.graphics.Color
import android.util.Log
import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageButton
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.para_mobile.R
import com.example.para_mobile.model.RouteSearchResult
import java.text.DecimalFormat

class RouteAdapter(
    private var routes: List<RouteSearchResult>,
    private var savedRoutes: Set<String>,
    private val onSaveToggle: (RouteSearchResult, Boolean) -> Unit
) : RecyclerView.Adapter<RouteAdapter.RouteViewHolder>() {

    private var onRouteClickListener: ((RouteSearchResult, Int) -> Unit)? = null

    init {
        Log.d("RouteAdapter", "RouteAdapter initialized with ${routes.size} routes.")
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RouteViewHolder {
        Log.d("RouteAdapter", "Creating ViewHolder.")
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_route, parent, false)
        return RouteViewHolder(view)
    }

    override fun onBindViewHolder(holder: RouteViewHolder, position: Int) {
        Log.d("RouteAdapter", "Binding data for position $position.")
        val route = routes[position]
        holder.bind(route, position)
    }

    override fun getItemCount(): Int {
        Log.d("RouteAdapter", "Item count: ${routes.size}")
        return routes.size
    }

    fun updateData(newRoutes: List<RouteSearchResult>) {
        Log.d("RouteAdapter", "Updating data with ${newRoutes.size} routes.")
        routes = newRoutes
        notifyDataSetChanged()
    }

    fun updateSavedRoutes(newSavedRoutes: Set<String>) {
        Log.d("RouteAdapter", "Updating saved routes with ${newSavedRoutes.size} entries.")
        savedRoutes = newSavedRoutes
        notifyDataSetChanged()
    }

    fun setOnRouteClickListener(listener: (RouteSearchResult, Int) -> Unit) {
        Log.d("RouteAdapter", "Setting route click listener.")
        onRouteClickListener = listener
    }

    inner class RouteViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        private val routeNumberText: TextView = itemView.findViewById(R.id.route_number)
        private val routeLocationsText: TextView = itemView.findViewById(R.id.route_locations)
        private val routeDistanceText: TextView = itemView.findViewById(R.id.route_distance)
        private val saveButton: ImageButton = itemView.findViewById(R.id.save_route_button)
        private val routeNumberBackground: View = itemView.findViewById(R.id.route_number)

        fun bind(route: RouteSearchResult, position: Int) {
            Log.d("RouteAdapter", "Binding route ${route.routeNumber} at position $position.")

            routeNumberText.text = route.routeNumber
            routeLocationsText.text = route.locations

            // Format distance to 1 decimal place
            val df = DecimalFormat("#.#")
            routeDistanceText.text = "${df.format(route.distance)} km"

            // Set route number background color based on position
            val colorIndex = position % ROUTE_COLORS.size
            val colorHex = ROUTE_COLORS[colorIndex]
            routeNumberBackground.setBackgroundColor(Color.parseColor(colorHex))

            // Check if this route is saved
            val routeKey = "${route.routeNumber}:${route.startLocation}:${route.endLocation}"
            val isSaved = savedRoutes.contains(routeKey)

            // Set the appropriate icon
            saveButton.setImageResource(
                if (isSaved) R.drawable.ic_favorite_filled
                else R.drawable.ic_favorite_outline
            )

            // Set click listeners
            saveButton.setOnClickListener {
                Log.d("RouteAdapter", "Save button clicked for route ${route.routeNumber}.")
                onSaveToggle(route, !isSaved)
            }

            itemView.setOnClickListener {
                Log.d("RouteAdapter", "Route item clicked: ${route.routeNumber}.")
                onRouteClickListener?.invoke(route, position)
            }
        }
    }

    companion object {
        val ROUTE_COLORS = listOf(
            "#1D8C2E", // Dark Green
            "#8C1D1D", // Maroon
            "#1D5F8C", // Dark Blue
            "#8C6D1D", // Dark Brown
            "#5D1D8C", // Dark Purple
            "#E03000", // Dark Red
            "#996600", // Dark Gold
            "#990066", // Dark Pink
            "#4B0082"  // Indigo
        )
    }
}
