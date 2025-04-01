"use client";

import { useEffect, useRef } from "react";
import { useLocation } from "./LocationContext";
import "../styles/MapView.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapView = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);
  const hoveredMarkerRef = useRef(null);
  const selectedMarkerRef = useRef(null);

  const locationContext = useLocation();
  const hoveredLocation = locationContext?.hoveredLocation;
  const selectedLocation = locationContext?.selectedLocation;

  // Initialize the map
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) {
      return;
    }

    if (mapInstanceRef.current) {
      return;
    }

    console.log("Initializing map...");

    // Fix Leaflet icon issue
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    // Create custom icons for different marker types
    const selectedIcon = new L.Icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
    });

    const hoveredIcon = new L.Icon({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      iconSize: [25, 41],
      iconAnchor: [12, 41],
      popupAnchor: [1, -34],
      shadowSize: [41, 41],
      className: "hovered-marker",
    });

    // Initialize the map centered on Cebu
    mapInstanceRef.current = L.map(mapRef.current).setView(
      [10.3157, 123.8854],
      13
    );

    // Add OpenStreetMap tiles
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapInstanceRef.current);

    // Force a resize after initialization to ensure the map fills the container
    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    // Cleanup function
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update markers when hoveredLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing hovered marker
    if (hoveredMarkerRef.current) {
      hoveredMarkerRef.current.remove();
      hoveredMarkerRef.current = null;
    }

    if (hoveredLocation) {
      console.log("Adding hovered marker at:", hoveredLocation);

      const hoveredIcon = L.divIcon({
        className: "hovered-marker",
        html: `<div class="marker-pin hovered"></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
      });

      hoveredMarkerRef.current = L.marker(
        [hoveredLocation.latitude, hoveredLocation.longitude],
        { icon: hoveredIcon }
      ).addTo(mapInstanceRef.current);

      hoveredMarkerRef.current.bindPopup(hoveredLocation.name);

      // Ensure map pans to marker
      mapInstanceRef.current.setView(
        [hoveredLocation.latitude, hoveredLocation.longitude],
        15
      );
    }
  }, [hoveredLocation]);

  // Update markers when selectedLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    // Remove existing selected marker
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    // Add new selected marker if available and not hovering
    if (selectedLocation && !hoveredLocation) {
      console.log("Adding selected marker at:", selectedLocation);

      // Create a custom icon for selected markers
      const selectedIcon = L.divIcon({
        className: "selected-marker",
        html: `<div class="marker-pin selected"></div>`,
        iconSize: [30, 42],
        iconAnchor: [15, 42],
      });

      // Create a new marker for the selected location
      selectedMarkerRef.current = L.marker(
        [selectedLocation.latitude, selectedLocation.longitude],
        { icon: selectedIcon }
      ).addTo(mapInstanceRef.current);

      // Add a popup with the location name and open it
      selectedMarkerRef.current.bindPopup(selectedLocation.name).openPopup();

      // Pan the map to the marker
      mapInstanceRef.current.panTo([
        selectedLocation.latitude,
        selectedLocation.longitude,
      ]);

      // Zoom in closer for selected locations
      mapInstanceRef.current.setZoom(16);
    }
  }, [selectedLocation, hoveredLocation]);

  return (
    <div className="map-wrapper">
      <div id="map" ref={mapRef} className="map-container"></div>
    </div>
  );
};

export default MapView;
