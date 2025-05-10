package com.example.para_mobile.adapter

import android.view.LayoutInflater
import android.view.View
import android.view.ViewGroup
import android.widget.ImageView
import android.widget.TextView
import androidx.recyclerview.widget.RecyclerView
import com.example.para_mobile.R
import com.example.para_mobile.model.LocationResult

class LocationAdapter(
    private var locations: List<LocationResult>,
    private val onItemClick: (LocationResult) -> Unit
) : RecyclerView.Adapter<LocationAdapter.LocationViewHolder>() {

    inner class LocationViewHolder(itemView: View) : RecyclerView.ViewHolder(itemView) {
        val locationName: TextView = itemView.findViewById(R.id.location_name)
        val locationTypeIcon: ImageView = itemView.findViewById(R.id.location_type_icon)
        val locationAddress: TextView? = itemView.findViewById(R.id.location_address)
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): LocationViewHolder {
        val view = LayoutInflater.from(parent.context)
            .inflate(R.layout.item_location, parent, false)
        return LocationViewHolder(view)
    }

    override fun onBindViewHolder(holder: LocationViewHolder, position: Int) {
        val location = locations[position]

        // Format the display name to be more readable
        val displayName = formatDisplayName(location.display_name)
        holder.locationName.text = displayName

        // Set the appropriate icon based on OSM type and tags
        val iconResource = getIconResourceForLocation(location)
        holder.locationTypeIcon.setImageResource(iconResource)

        // Optionally show address details if available
        holder.locationAddress?.let { addressView ->
            val addressParts = location.display_name.split(", ")
            if (addressParts.size > 1) {
                val addressText = addressParts.drop(1).take(2).joinToString(", ")
                addressView.text = addressText
                addressView.visibility = View.VISIBLE
            } else {
                addressView.visibility = View.GONE
            }
        }

        // Set click listeners
        holder.itemView.setOnClickListener {
            onItemClick(location)
        }
    }

    override fun getItemCount(): Int = locations.size

    fun updateData(newLocations: List<LocationResult>) {
        locations = newLocations
        notifyDataSetChanged()
    }

    /**
     * Format the display name to be more readable by showing only the first part
     */
    private fun formatDisplayName(displayName: String): String {
        val parts = displayName.split(", ")
        return parts.firstOrNull() ?: displayName
    }

    /**
     * Get the appropriate icon resource based on OSM data
     */
    private fun getIconResourceForLocation(location: LocationResult): Int {
        // First check the OSM type
        val osmType = location.osm_type.lowercase()
        val locationType = location.type.lowercase()
        val displayName = location.display_name.lowercase()

        // Check for specific types based on OSM data
        return when {
            // Educational institutions
            locationType.contains("school") ||
                    locationType.contains("university") ||
                    locationType.contains("college") ||
                    displayName.contains("school") ||
                    displayName.contains("university") ||
                    displayName.contains("college") -> R.drawable.ic_school

            // Commercial places
            locationType.contains("shop") ||
                    locationType.contains("mall") ||
                    locationType.contains("supermarket") ||
                    displayName.contains("mall") ||
                    displayName.contains("shop") ||
                    displayName.contains("store") -> R.drawable.ic_mall

            // Transportation
            locationType.contains("aeroway") ||
                    locationType.contains("airport") ||
                    displayName.contains("airport") ||
                    displayName.contains("terminal") -> R.drawable.ic_airport

            // Food and dining
            locationType.contains("restaurant") ||
                    locationType.contains("cafe") ||
                    locationType.contains("bar") ||
                    displayName.contains("restaurant") ||
                    displayName.contains("café") ||
                    displayName.contains("cafe") -> R.drawable.ic_restaurant

            // Parks and recreation
            locationType.contains("park") ||
                    locationType.contains("garden") ||
                    locationType.contains("leisure") ||
                    displayName.contains("park") ||
                    displayName.contains("garden") -> R.drawable.ic_park

            // Healthcare
            locationType.contains("hospital") ||
                    locationType.contains("clinic") ||
                    locationType.contains("healthcare") ||
                    displayName.contains("hospital") ||
                    displayName.contains("clinic") -> R.drawable.ic_hospital

            // Accommodation
            locationType.contains("hotel") ||
                    locationType.contains("hostel") ||
                    locationType.contains("motel") ||
                    displayName.contains("hotel") ||
                    displayName.contains("hostel") -> R.drawable.ic_hotel

            // Roads and highways
            locationType.contains("highway") ||
                    osmType == "way" && (
                    locationType.contains("road") ||
                            locationType.contains("street") ||
                            locationType.contains("avenue")
                    ) -> R.drawable.ic_road

            // Buildings and structures
            locationType.contains("building") ||
                    osmType == "way" && locationType.contains("house") ||
                    displayName.contains("building") ||
                    displayName.contains("tower") -> R.drawable.ic_building

            // Default for anything else
            else -> R.drawable.ic_default_location
        }
    }
}
