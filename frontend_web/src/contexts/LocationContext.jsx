/* eslint-disable react-refresh/only-export-components */
"use client";

import { createContext, useState, useContext, useEffect, useRef } from "react";

// Create a context for location data
const LocationContext = createContext();

// Reverse geocoding utility using OpenStreetMap Nominatim
async function reverseGeocode(lat, lon) {
  const url = new URL("https://nominatim.openstreetmap.org/reverse");
  url.searchParams.set("format", "json");
  url.searchParams.set("lat", lat);
  url.searchParams.set("lon", lon);
  url.searchParams.set("addressdetails", 1);

  const res = await fetch(url.toString(), {
    headers: { "User-Agent": "CebuLocationSearchApp/1.0" },
  });
  if (!res.ok) throw new Error(`Reverse geocode failed: ${res.statusText}`);
  const data = await res.json();
  return data.display_name;
}

// Add userPosition state and watchId ref to the LocationProvider component
export function LocationProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [initialLocation, setInitialLocation] = useState("");
  const [finalDestination, setFinalDestination] = useState("");
  const [initialFocused, setInitialFocused] = useState(false);
  const [finalFocused, setFinalFocused] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [followUserLocation, setFollowUserLocation] = useState(false);
  const watchIdRef = useRef(null);

  // Store selected location coordinates for mapping
  const [selectedLocations, setSelectedLocations] = useState({
    initial: { lat: null, lon: null },
    final: { lat: null, lon: null },
  });

  // Store locations for map pins
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [pinnedLocation, setPinnedLocation] = useState(null);

  // Start watching user position when component mounts
  useEffect(() => {
    startWatchingPosition();

    // Clean up when component unmounts
    return () => {
      stopWatchingPosition();
    };
  }, []);

  // Function to start watching user position
  const startWatchingPosition = () => {
    if (!navigator.geolocation) {
      console.error("Geolocation is not supported by your browser.");
      return;
    }

    // Clear any existing watchers
    stopWatchingPosition();

    // Start watching position
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude } = position.coords;
        setUserPosition({ latitude, longitude });
      },
      (error) => {
        console.error("Error watching position:", error);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  // Function to stop watching user position
  const stopWatchingPosition = () => {
    if (watchIdRef.current !== null) {
      navigator.geolocation.clearWatch(watchIdRef.current);
      watchIdRef.current = null;
    }
  };

  // Toggle follow user location
  const toggleFollowUserLocation = () => {
    setFollowUserLocation((prev) => !prev);
  };

  // Update search query based on focus and input values
  useEffect(() => {
    if (initialFocused) setSearchQuery(initialLocation);
    else if (finalFocused) setSearchQuery(finalDestination);
  }, [initialLocation, finalDestination, initialFocused, finalFocused]);

  // Update locations
  const updateInitialLocation = (location, coords = null) => {
    setInitialLocation(location);
    if (coords)
      setSelectedLocations((prev) => ({
        ...prev,
        initial: { lat: coords.latitude, lon: coords.longitude },
      }));
  };

  const updateFinalDestination = (destination, coords = null) => {
    setFinalDestination(destination);
    if (coords)
      setSelectedLocations((prev) => ({
        ...prev,
        final: { lat: coords.latitude, lon: coords.longitude },
      }));
  };

  // Set current location as source, with reverse geocode
  const setCurrentLocationAsSource = () => {
    if (!userPosition) {
      alert(
        "Your location is not available yet. Please try again in a moment."
      );
      return;
    }

    const { latitude, longitude } = userPosition;
    (async () => {
      let locationName;
      try {
        locationName = await reverseGeocode(latitude, longitude);
      } catch (error) {
        console.error("Error reverse geocoding:", error);
        locationName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
      }

      // update based on focus
      if (initialFocused)
        updateInitialLocation(locationName, { latitude, longitude });
      else if (finalFocused)
        updateFinalDestination(locationName, { latitude, longitude });
      else updateInitialLocation(locationName, { latitude, longitude });

      setSelectedLocation({ latitude, longitude, name: locationName });
    })();
  };

  // Focus handlers
  const handleInitialFocus = () => {
    setInitialFocused(true);
    setFinalFocused(false);
  };
  const handleInitialBlur = () => setInitialFocused(false);
  const handleFinalFocus = () => {
    setFinalFocused(true);
    setInitialFocused(false);
  };
  const handleFinalBlur = () => setFinalFocused(false);

  // Swap locations
  const swapLocations = () => {
    const tempLoc = initialLocation;
    const tempCoords = selectedLocations.initial;
    setInitialLocation(finalDestination);
    setFinalDestination(tempLoc);
    setSelectedLocations({
      initial: selectedLocations.final,
      final: tempCoords,
    });
  };

  return (
    <LocationContext.Provider
      value={{
        // state
        searchQuery,
        initialLocation,
        finalDestination,
        initialFocused,
        finalFocused,
        selectedLocations,
        selectedLocation,
        pinnedLocation,
        showConfirmationModal,
        userPosition,
        followUserLocation,

        // setters
        setSearchQuery,
        updateInitialLocation,
        updateFinalDestination,
        setCurrentLocationAsSource,
        setSelectedLocation,
        setPinnedLocation,
        setShowConfirmationModal,
        setFollowUserLocation,

        // actions
        handleInitialFocus,
        handleInitialBlur,
        handleFinalFocus,
        handleFinalBlur,
        swapLocations,
        startWatchingPosition,
        stopWatchingPosition,
        toggleFollowUserLocation,

        // utils
        reverseGeocode,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

// Custom hook to use the location context
export function useLocation() {
  return useContext(LocationContext);
}
