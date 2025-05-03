package com.example.para_mobile.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.para_mobile.R
import com.example.para_mobile.model.JeepneyRoute

class JeepneyRouteAdapter(
    private val routes: List<JeepneyRoute>,
    private val onRouteSelected: (JeepneyRoute) -> Unit,
    private val onFavoriteToggled: (JeepneyRoute, Boolean) -> Unit
) : RecyclerView.Adapter<JeepneyRouteAdapter.RouteViewHolder>() {

    // Keep track of favorited routes
    private val favoritedRoutes = mutableSetOf<String>()

    // Store calculated distances for each route
    private val routeDistances = mutableMapOf<String, Double>()

    class RouteViewHolder(view: View) : RecyclerView.ViewHolder(view) {
        val jeepneyCodeBadge: TextView = view.findViewById(R.id.jeepneyCodeBadge)
        val routeDescription: TextView = view.findViewById(R.id.routeDescription)
        val favoriteButton: ImageView = view.findViewById(R.id.favoriteButton)
        val distanceLabel: TextView = view.findViewById(R.id.distanceLabel)
        val distanceValue: TextView = view.findViewById(R.id.distanceValue)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): RouteViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_jeepney_route, parent, false)
        return RouteViewHolder(view)
    }

    override fun onBindViewHolder(holder: RouteViewHolder, position: Int) {
        val route = routes[position]

        // Set route number
        holder.jeepneyCodeBadge.text = route.routeNumber

        // Set route description (locations)
        holder.routeDescription.text = route.locations // Directly use the String

        // Set distance
        val distance = routeDistances[route.relationId] ?: (4.0 + position * 0.7) // Placeholder distance
        holder.distanceValue.text = String.format("%.1f km", distance)

        // Set favorite button state
        val isFavorite = favoritedRoutes.contains(route.relationId)
        holder.favoriteButton.setImageResource(
            if (isFavorite) R.drawable.ic_favorite_filled
            else R.drawable.ic_favorite_outline
        )

        // Set up favorite button
        holder.favoriteButton.setOnClickListener {
            val newFavoriteState = !favoritedRoutes.contains(route.relationId)

            if (newFavoriteState) {
                favoritedRoutes.add(route.relationId)
                holder.favoriteButton.setImageResource(R.drawable.ic_favorite_filled)
            } else {
                favoritedRoutes.remove(route.relationId)
                holder.favoriteButton.setImageResource(R.drawable.ic_favorite_outline)
            }

            onFavoriteToggled(route, newFavoriteState)
        }

        // Make the entire item clickable
        holder.itemView.setOnClickListener {
            onRouteSelected(route)
        }
    }

    // Method to update distances for routes
    fun updateDistances(distances: Map<String, Double>) {
        routeDistances.putAll(distances)
        notifyDataSetChanged()
    }

    override fun getItemCount() = routes.size
}
