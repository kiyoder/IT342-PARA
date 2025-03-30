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
  const updateInitialLocation = (location) => {
    setInitialLocation(location);
  };

  const updateFinalDestination = (destination) => {
    setFinalDestination(destination);
  };

  // Focus handlers
  const handleInitialFocus = () => {
    setInitialFocused(true);
  };

  const handleInitialBlur = () => {
    setInitialFocused(false);
  };

  const handleFinalFocus = () => {
    setFinalFocused(true);
  };

  const handleFinalBlur = () => {
    setFinalFocused(false);
  };

  // Swap locations
  const swapLocations = () => {
    const temp = initialLocation;
    setInitialLocation(finalDestination);
    setFinalDestination(temp);
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
