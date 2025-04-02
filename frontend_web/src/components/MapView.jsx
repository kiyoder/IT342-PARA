import React, { useEffect, useRef, useState } from "react";
import { useLocation } from "./LocationContext";
import "../styles/MapView.css";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const MapView = () => {
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const userLocationCircleRef = useRef(null);
  const [userPosition, setUserPosition] = useState(null);
  const { pinnedLocation } = useLocation();

  // Get user's current position
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Error getting user position:", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  // Initialize the map
  useEffect(() => {
    if (typeof window === "undefined" || !mapRef.current) return;
    if (mapInstanceRef.current) return;

    // Fix Leaflet icon issue
    delete L.Icon.Default.prototype._getIconUrl;
    L.Icon.Default.mergeOptions({
      iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
      iconRetinaUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
      shadowUrl:
        "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
    });

    // Initialize map centered on Cebu
    mapInstanceRef.current = L.map(mapRef.current).setView(
      [10.3157, 123.8854],
      13
    );

    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png",
      {
        attribution:
          '&copy; <a href="https://carto.com/">CARTO</a> contributors',
      }
    ).addTo(mapInstanceRef.current);

    setTimeout(() => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.invalidateSize();
      }
    }, 100);

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Add user location circle when available
  useEffect(() => {
    if (!mapInstanceRef.current || !userPosition) return;

    if (userLocationCircleRef.current) {
      userLocationCircleRef.current.remove();
      userLocationCircleRef.current = null;
    }

    userLocationCircleRef.current = L.circle(
      [userPosition.latitude, userPosition.longitude],
      {
        color: "transparent",
        fillColor: "#ff5733",
        fillOpacity: 0.4,
        radius: 80,
      }
    ).addTo(mapInstanceRef.current);

    L.circle([userPosition.latitude, userPosition.longitude], {
      color: "#ff5733",
      fillColor: "#ff5733",
      fillOpacity: 1,
      radius: 30,
    })
      .addTo(mapInstanceRef.current)
      .bindPopup("Your current location");

    if (!pinnedLocation) {
      mapInstanceRef.current.setView(
        [userPosition.latitude, userPosition.longitude],
        15
      );
    }
  }, [userPosition, pinnedLocation]);

  // Update marker when pinnedLocation changes
  useEffect(() => {
    if (!mapInstanceRef.current) return;

    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    if (pinnedLocation) {
      const selectedIcon = L.divIcon({
        className: "selected-marker",
        html: '<div class="marker-pin selected"></div>',
        iconSize: [30, 42],
        iconAnchor: [15, 42],
      });

      selectedMarkerRef.current = L.marker(
        [pinnedLocation.latitude, pinnedLocation.longitude],
        { icon: selectedIcon }
      ).addTo(mapInstanceRef.current);

      selectedMarkerRef.current.bindPopup(pinnedLocation.name).openPopup();

      mapInstanceRef.current.panTo([
        pinnedLocation.latitude,
        pinnedLocation.longitude,
      ]);
      mapInstanceRef.current.setZoom(16);
    }
  }, [pinnedLocation]);

  return (
    <div className="map-wrapper">
      <div id="map" ref={mapRef} className="map-container"></div>
    </div>
  );
};

export default MapView;
