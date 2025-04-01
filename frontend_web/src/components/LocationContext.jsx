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

  // Store selected location coordinates for mapping
  const [selectedLocations, setSelectedLocations] = useState({
    initial: { lat: null, lon: null },
    final: { lat: null, lon: null },
  });

  // Store hovered and selected locations for map pins
  const [hoveredLocation, setHoveredLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);

  // Update search query based on focus and input values
  useEffect(() => {
    if (initialFocused) {
      setSearchQuery(initialLocation);
    } else if (finalFocused) {
      setSearchQuery(finalDestination);
    } else {
      // Clear search query when no input is focused
      setSearchQuery("");
    }
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

              if (initialFocused || (!initialFocused && !finalFocused)) {
                updateInitialLocation(locationName, { latitude, longitude });
              } else if (finalFocused) {
                updateFinalDestination(locationName, { latitude, longitude });
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

              if (initialFocused || (!initialFocused && !finalFocused)) {
                updateInitialLocation(locationName, { latitude, longitude });
              } else if (finalFocused) {
                updateFinalDestination(locationName, { latitude, longitude });
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
        hoveredLocation,
        setHoveredLocation,
        selectedLocation,
        setSelectedLocation,
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
