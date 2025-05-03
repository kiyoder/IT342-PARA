package com.example.para_mobile.util

import android.widget.TextView
import com.example.para_mobile.R
import com.example.para_mobile.activity.BottomSheetManager
import org.osmdroid.views.MapView
import org.osmdroid.views.overlay.Marker
import org.osmdroid.views.overlay.infowindow.InfoWindow

class CustomInfoWindow(
    private val mapView: MapView,
    private val bottomSheetManager: BottomSheetManager
) : InfoWindow(R.layout.custom_info_window, mapView) {

    override fun onOpen(item: Any?) {
        val marker = item as? Marker ?: return

        // Find views
        val titleView = mView.findViewById<TextView>(R.id.info_window_title)
        val subtitleView = mView.findViewById<TextView>(R.id.info_window_subtitle)

        // Set title
        titleView.text = marker.title ?: "Unknown Location"

        // Set subtitle (use snippet if available, otherwise extract from title)
        val subtitle = marker.snippet ?: extractSubtitle(marker.title)
        subtitleView.text = subtitle
    }

    private fun extractSubtitle(title: String?): String {
        if (title == null) return ""

        // Try to extract a meaningful subtitle from the title
        // Often location titles from geocoding have comma-separated parts
        val parts = title.split(",")
        return if (parts.size > 1) {
            // Return the second part (often the city or area)
            parts[1].trim()
        } else if (title.length > 30) {
            // If it's a long title without commas, just truncate
            "${title.substring(0, 27)}..."
        } else {
            // Otherwise just return the title
            title
        }
    }

    override fun onClose() {
        // No special cleanup needed
    }


}
