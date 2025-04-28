/* eslint-disable react-refresh/only-export-components */
"use client";

import { createContext, useState, useContext, useEffect } from "react";

// Create a context for location data
const LocationContext = createContext();

// Create a provider component
export function LocationProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [initialLocation, setInitialLocation] = useState("");
  const [finalDestination, setFinalDestination] = useState("");
  const [initialFocused, setInitialFocused] = useState(false);
  const [finalFocused, setFinalFocused] = useState(false);

  // Added state to control confirmation modal visibility
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Store selected location coordinates for mapping
  const [selectedLocations, setSelectedLocations] = useState({
    initial: { lat: null, lon: null },
    final: { lat: null, lon: null },
  });

  // Store locations for map pins
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [pinnedLocation, setPinnedLocation] = useState(null);

  // Update search query based on focus and input values
  useEffect(() => {
    if (initialFocused) {
      setSearchQuery(initialLocation);
    } else if (finalFocused) {
      setSearchQuery(finalDestination);
    }
    // Don't reset search query when neither is focused to maintain the current search
  }, [initialLocation, finalDestination, initialFocused, finalFocused]);

  // Update locations
  const updateInitialLocation = (location, coordinates = null) => {
    setInitialLocation(location);
    if (coordinates) {
      setSelectedLocations((prev) => ({
        ...prev,
        initial: { lat: coordinates.latitude, lon: coordinates.longitude },
      }));
    }
  };

  const updateFinalDestination = (destination, coordinates = null) => {
    setFinalDestination(destination);
    if (coordinates) {
      setSelectedLocations((prev) => ({
        ...prev,
        final: { lat: coordinates.latitude, lon: coordinates.longitude },
      }));
    }
  };

  // Set current location as source
  const setCurrentLocationAsSource = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Use reverse geocoding to get address
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: { "User-Agent": "CebuLocationSearchApp" },
            }
          )
            .then((response) => response.json())
            .then((data) => {
              const locationName = data.display_name;

              // Use the current focus state to determine which location to update
              if (initialFocused) {
                updateInitialLocation(locationName, { latitude, longitude });
              } else if (finalFocused) {
                updateFinalDestination(locationName, { latitude, longitude });
              } else {
                // Default behavior if neither is focused
                updateInitialLocation(locationName, { latitude, longitude });
              }

              // Set the selected location for the map pin
              setSelectedLocation({
                latitude,
                longitude,
                name: locationName,
              });
            })
            .catch((error) => {
              console.error("Error getting location name:", error);
              // Use coordinates as fallback
              const locationName = `${latitude.toFixed(6)}, ${longitude.toFixed(
                6
              )}`;

              // Use the current focus state to determine which location to update
              if (initialFocused) {
                updateInitialLocation(locationName, { latitude, longitude });
              } else if (finalFocused) {
                updateFinalDestination(locationName, { latitude, longitude });
              } else {
                // Default behavior if neither is focused
                updateInitialLocation(locationName, { latitude, longitude });
              }

              // Set the selected location for the map pin
              setSelectedLocation({
                latitude,
                longitude,
                name: locationName,
              });
            });
        },
        (error) => {
          console.error("Error getting current location:", error);
          alert(
            "Unable to get your current location. Please check your browser permissions."
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Focus handlers
  const handleInitialFocus = () => {
    setInitialFocused(true);
    setFinalFocused(false);
  };

  const handleInitialBlur = () => {
    setInitialFocused(false);
  };

  const handleFinalFocus = () => {
    setFinalFocused(true);
    setInitialFocused(false);
  };

  const handleFinalBlur = () => {
    setFinalFocused(false);
  };

  // Swap locations
  const swapLocations = () => {
    const tempLocation = initialLocation;
    const tempCoordinates = selectedLocations.initial;

    setInitialLocation(finalDestination);
    setFinalDestination(tempLocation);

    setSelectedLocations({
      initial: selectedLocations.final,
      final: tempCoordinates,
    });
  };

  return (
    <LocationContext.Provider
      value={{
        searchQuery,
        setSearchQuery,
        initialLocation,
        updateInitialLocation,
        finalDestination,
        updateFinalDestination,
        handleInitialFocus,
        handleInitialBlur,
        handleFinalFocus,
        handleFinalBlur,
        swapLocations,
        initialFocused,
        finalFocused,
        selectedLocations,
        setCurrentLocationAsSource,
        selectedLocation,
        setSelectedLocation,
        pinnedLocation,
        setPinnedLocation,
        showConfirmationModal,
        setShowConfirmationModal,
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
