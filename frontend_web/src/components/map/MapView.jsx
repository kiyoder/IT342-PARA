"use client";

import { useEffect, useRef, useState } from "react";
import { useLocation } from "../../contexts/LocationContext";
import { useRoute } from "../../contexts/RouteContext";
import "../../styles/MapView.css";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import ConfirmationModal from "../location/ConfirmationModal";
import JeepneyRoute from "./JeepneyRoute";

const MapView = ({ disableAutoSearch = false }) => {
  const mapContainerRef = useRef(null);
  const mapRef = useRef(null);
  const initialMarkerRef = useRef(null);
  const finalMarkerRef = useRef(null);
  const selectedMarkerRef = useRef(null);
  const userMarkerRef = useRef(null);
  const [userPosition, setUserPosition] = useState(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const directRouteLayerId = useRef("direct-route");
  const directRouteAdded = useRef(false);

  // Get route information from context
  const { showJeepneyRoute, routeNumber, relationId } = useRoute();

  const {
    selectedLocation,
    setSelectedLocation,
    pinnedLocation,
    setPinnedLocation,
    selectedLocations,
    showConfirmationModal,
    setShowConfirmationModal,
  } = useLocation();

  // Set your Mapbox access token
  mapboxgl.accessToken =
    "pk.eyJ1IjoianJsbGVqYW5lIiwiYSI6ImNtOTB0bHB2bjBweGkya3B2MjR2cm8wazEifQ.NYwhCjeEnhl8Obo6_g-ojQ";

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
    if (!mapContainerRef.current) return;
    if (mapRef.current) return;

    // Initialize map centered on Cebu (or user's location if available)
    const initialCenter = userPosition
      ? [userPosition.longitude, userPosition.latitude]
      : [123.8854, 10.3157]; // Cebu coordinates

    mapRef.current = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: initialCenter,
      zoom: 13,
    });

    // Set map loaded state when map is ready
    mapRef.current.on("load", () => {
      setMapLoaded(true);
    });

    // Clean up on unmount
    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, [userPosition]);

  // Create a custom HTML marker element
  const createMarkerElement = (markerType) => {
    const el = document.createElement("div");
    el.className = "marker-wrapper";

    // Special case for user location marker - make it circular
    if (markerType === "user-location") {
      const userDot = document.createElement("div");
      userDot.className = "user-location-dot";
      el.appendChild(userDot);
      return el;
    }

    // For initial location marker
    if (markerType === "initial") {
      el.innerHTML = `
        <div class="custom-marker initial-marker">
          <svg width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M12.5 8.61335C12.5 9.82975 11.3813 10.815 10 10.815C8.61875 10.815 7.5 9.82975 7.5 8.61335C7.5 7.39694 8.61875 6.4117 10 6.4117C11.3813 6.4117 12.5 7.39694 12.5 8.61335ZM10 19.3802C10 19.3802 3.75 11.6745 3.75 8.372C3.75 5.33704 6.55375 2.8679 10 2.8679C13.4462 2.8679 16.25 5.33704 16.25 8.372C16.25 11.6745 10 19.3802 10 19.3802ZM10 0.66626C5.1675 0.66626 1.25 4.11623 1.25 8.372C1.25 12.6278 10 22.6827 10 22.6827C10 22.6827 18.75 12.6278 18.75 8.372C18.75 4.11623 14.8325 0.66626 10 0.66626Z"
              fill="#FF3B10"
            />
          </svg>
        </div>
      `;
      return el;
    }

    // For final location marker
    if (markerType === "final") {
      el.innerHTML = `
        <div class="custom-marker final-marker">
          <svg width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10 10.2964C8.61875 10.2964 7.5 9.3112 7.5 8.09479C7.5 6.87838 8.61875 5.89315 10 5.89315C11.3813 5.89315 12.5 6.87838 12.5 8.09479C12.5 9.3112 11.3813 10.2964 10 10.2964ZM10 0.147705C5.1675 0.147705 1.25 3.59768 1.25 7.85345C1.25 12.1092 10 22.1641 10 22.1641C10 22.1641 18.75 12.1092 18.75 7.85345C18.75 3.59768 14.8325 0.147705 10 0.147705Z"
              fill="#FF3B10"
            />
          </svg>
        </div>
      `;
      return el;
    }

    // For selected location marker
    if (markerType === "selected") {
      el.innerHTML = `
        <div class="custom-marker selected-marker">
          <svg width="30" height="30" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 25 25">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M10 10.2964C8.61875 10.2964 7.5 9.3112 7.5 8.09479C7.5 6.87838 8.61875 5.89315 10 5.89315C11.3813 5.89315 12.5 6.87838 12.5 8.09479C12.5 9.3112 11.3813 10.2964 10 10.2964ZM10 0.147705C5.1675 0.147705 1.25 3.59768 1.25 7.85345C1.25 12.1092 10 22.1641 10 22.1641C10 22.1641 18.75 12.1092 18.75 7.85345C18.75 3.59768 14.8325 0.147705 10 0.147705Z"
              fill="#FF3B10"
            />
          </svg>
        </div>
      `;
      return el;
    }

    // Fallback to regular marker pin
    const pin = document.createElement("div");
    pin.className = `marker-pin ${markerType}`;
    el.appendChild(pin);
    return el;
  };

  // Add user location marker when available
  useEffect(() => {
    if (!mapRef.current || !userPosition || !mapLoaded) return;

    // Remove existing user marker if it exists
    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    // Create a user location marker
    const el = createMarkerElement("user-location");

    userMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([userPosition.longitude, userPosition.latitude])
      .addTo(mapRef.current);

    // If no other markers, center on user location
    if (
      !initialMarkerRef.current &&
      !finalMarkerRef.current &&
      !selectedMarkerRef.current
    ) {
      mapRef.current.flyTo({
        center: [userPosition.longitude, userPosition.latitude],
        zoom: 15,
        essential: true,
      });
    }
  }, [userPosition, mapLoaded]);

  // Handle selected location (temporary selection before confirmation)
  useEffect(() => {
    if (!mapRef.current || !selectedLocation || !mapLoaded) return;

    // Remove existing selected marker if it exists
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    // Create a selected location marker
    const el = createMarkerElement("selected");

    selectedMarkerRef.current = new mapboxgl.Marker(el)
      .setLngLat([selectedLocation.longitude, selectedLocation.latitude])
      .addTo(mapRef.current);

    // Fly to the selected location
    mapRef.current.flyTo({
      center: [selectedLocation.longitude, selectedLocation.latitude],
      zoom: 15,
      essential: true,
      duration: 1500,
      // Show confirmation modal after animation completes
      complete: () => {
        setTimeout(() => {
          setShowConfirmationModal(true);
        }, 100);
      },
    });
  }, [selectedLocation, mapLoaded, setShowConfirmationModal]);

  // Fetch directions and update route
  const fetchDirections = async (start, end) => {
    try {
      const response = await fetch(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${start[0]},${start[1]};${end[0]},${end[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`
      );

      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        return data.routes[0].geometry.coordinates;
      } else {
        console.error("No routes found in directions response");
        // Fallback to straight line if no route found
        return [start, end];
      }
    } catch (error) {
      console.error("Error fetching directions:", error);
      // Fallback to straight line if error
      return [start, end];
    }
  };

  // Function to ensure the direct route is on top
  const moveDirectRouteToTop = () => {
    if (mapRef.current && mapRef.current.getLayer(directRouteLayerId.current)) {
      try {
        // Move the direct route layer to the top
        mapRef.current.moveLayer(directRouteLayerId.current);
        console.log("Direct route moved to top");
      } catch (error) {
        console.error("Error moving direct route to top:", error);
      }
    }
  };

  // Update markers and route when locations change
  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Skip auto-searching if disabled (for SavedRoutes page)
    if (disableAutoSearch && !showJeepneyRoute) return;

    // Clear existing markers
    if (initialMarkerRef.current) {
      initialMarkerRef.current.remove();
      initialMarkerRef.current = null;
    }

    if (finalMarkerRef.current) {
      finalMarkerRef.current.remove();
      finalMarkerRef.current = null;
    }

    // Add initial location marker if coordinates exist
    if (selectedLocations.initial.lat && selectedLocations.initial.lon) {
      const el = createMarkerElement("initial");

      initialMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([
          selectedLocations.initial.lon,
          selectedLocations.initial.lat,
        ])
        .addTo(mapRef.current);
    }

    // Add final location marker if coordinates exist
    if (selectedLocations.final.lat && selectedLocations.final.lon) {
      const el = createMarkerElement("final");

      finalMarkerRef.current = new mapboxgl.Marker(el)
        .setLngLat([selectedLocations.final.lon, selectedLocations.final.lat])
        .addTo(mapRef.current);
    }

    // Draw route between initial and final locations if both exist
    if (
      selectedLocations.initial.lat &&
      selectedLocations.initial.lon &&
      selectedLocations.final.lat &&
      selectedLocations.final.lon &&
      mapLoaded
    ) {
      const start = [
        selectedLocations.initial.lon,
        selectedLocations.initial.lat,
      ];
      const destination = [
        selectedLocations.final.lon,
        selectedLocations.final.lat,
      ];

      // Fetch directions and update the route
      fetchDirections(start, destination).then((coordinates) => {
        // Remove existing direct route layer if it exists
        if (mapRef.current.getLayer(directRouteLayerId.current)) {
          mapRef.current.removeLayer(directRouteLayerId.current);
        }

        // Remove existing direct route source if it exists
        if (mapRef.current.getSource("direct-route-source")) {
          mapRef.current.removeSource("direct-route-source");
        }

        // Add new source and layer
        mapRef.current.addSource("direct-route-source", {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates: coordinates,
            },
          },
        });

        mapRef.current.addLayer({
          id: directRouteLayerId.current,
          type: "line",
          source: "direct-route-source",
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            "line-color": "#FF7F00", // Orange for direct route
            "line-width": 3, // Thinner than jeepney routes
            "line-opacity": 0.8,
          },
        });

        directRouteAdded.current = true;

        // Ensure the direct route is on top
        moveDirectRouteToTop();

        // Fit map to show the route
        const bounds = new mapboxgl.LngLatBounds();

        // Extend bounds with all coordinates in the route
        coordinates.forEach((coord) => {
          bounds.extend(coord);
        });

        mapRef.current.fitBounds(bounds, {
          padding: 80,
          duration: 1000,
        });
      });
    }
  }, [selectedLocations, mapLoaded, disableAutoSearch, showJeepneyRoute]);

  // Ensure direct route stays on top when jeepney routes are added
  useEffect(() => {
    if (showJeepneyRoute && mapLoaded && directRouteAdded.current) {
      // Add a small delay to ensure the jeepney route has been added
      const timer = setTimeout(() => {
        moveDirectRouteToTop();
      }, 1000);

      // Also set up an interval to keep checking and moving the direct route to top
      const interval = setInterval(() => {
        moveDirectRouteToTop();
      }, 2000);

      return () => {
        clearTimeout(timer);
        clearInterval(interval);
      };
    }
  }, [showJeepneyRoute, mapLoaded]);

  // Handle confirmation
  const handleConfirm = () => {
    // Set the selected location as the pinned location
    if (selectedLocation) {
      setPinnedLocation(selectedLocation);
    }
    // Hide the confirmation modal
    setShowConfirmationModal(false);
  };

  // Handle cancellation
  const handleCancel = () => {
    // Clear the selected location
    setSelectedLocation(null);

    // Remove the selected marker
    if (selectedMarkerRef.current) {
      selectedMarkerRef.current.remove();
      selectedMarkerRef.current = null;
    }

    // Hide the confirmation modal
    setShowConfirmationModal(false);

    // If there's a pinned location, fly back to it
    if (pinnedLocation) {
      mapRef.current.flyTo({
        center: [pinnedLocation.longitude, pinnedLocation.latitude],
        zoom: 15,
        essential: true,
        duration: 1500,
      });
    }
    // Otherwise fly to user position if available
    else if (userPosition) {
      mapRef.current.flyTo({
        center: [userPosition.longitude, userPosition.latitude],
        zoom: 15,
        essential: true,
        duration: 1500,
      });
    }
  };

  return (
    <div className="map-wrapper">
      <div ref={mapContainerRef} className="map-container"></div>

      {/* Show confirmation modal after map animation completes */}
      {showConfirmationModal && selectedLocation && (
        <ConfirmationModal
          location={selectedLocation}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
        />
      )}

      {mapLoaded && showJeepneyRoute && relationId && (
        <JeepneyRoute
          map={mapRef}
          mapLoaded={mapLoaded}
          routeNumber={routeNumber}
          relationId={relationId}
          onRouteAdded={moveDirectRouteToTop}
        />
      )}
    </div>
  );
};

export default MapView;
