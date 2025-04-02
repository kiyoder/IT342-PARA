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
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [pinnedLocation, setPinnedLocation] = useState(null);
  // Store selected location coordinates for mapping
  const [selectedLocations, setSelectedLocations] = useState({
    initial: { lat: null, lon: null },
    final: { lat: null, lon: null },
  });

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
      // Update pinnedLocation if initial is the one being updated
      setPinnedLocation({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        name: location,
      });
    }
  };

  const updateFinalDestination = (destination, coordinates = null) => {
    setFinalDestination(destination);
    if (coordinates) {
      setSelectedLocations((prev) => ({
        ...prev,
        final: { lat: coordinates.latitude, lon: coordinates.longitude },
      }));
      // Update pinnedLocation if final is the one being updated
      setPinnedLocation({
        latitude: coordinates.latitude,
        longitude: coordinates.longitude,
        name: destination,
      });
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

              // Also update the pinned location
              setPinnedLocation({
                latitude,
                longitude,
                name: locationName,
              });
            })
            .catch((error) => {
              console.error("Error getting location name:", error);
              const locationName = `${latitude.toFixed(6)}, ${longitude.toFixed(
                6
              )}`;

              if (initialFocused || (!initialFocused && !finalFocused)) {
                updateInitialLocation(locationName, { latitude, longitude });
              } else if (finalFocused) {
                updateFinalDestination(locationName, { latitude, longitude });
              }

              // Also update the pinned location
              setPinnedLocation({
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

  // Focus handlers remain unchanged
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

  // Swap locations (if needed)
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
        selectedLocation,
        setSelectedLocation,
        setCurrentLocationAsSource,
        pinnedLocation,
        setPinnedLocation,
      }}
    >
      {children}
    </LocationContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function useLocation() {
  return useContext(LocationContext);
}
