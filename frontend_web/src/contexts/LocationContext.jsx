/* eslint-disable react-refresh/only-export-components */
"use client";

import { createContext, useState, useContext, useEffect } from "react";
import {
  fetchTemperature,
  getCachedTemperature,
  cacheTemperature,
  getFallbackTemperature,
  normalizeCoordinates,
} from "../services/api/WeatherService";
import { info, error } from "../services/utils/logger";

// Create a context for location data
const LocationContext = createContext();

const CONTEXT = "LocationContext";

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

// Create a provider component
export function LocationProvider({ children }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [initialLocation, setInitialLocation] = useState("");
  const [finalDestination, setFinalDestination] = useState("");
  const [initialFocused, setInitialFocused] = useState(false);
  const [finalFocused, setFinalFocused] = useState(false);
  const [showConfirmationModal, setShowConfirmationModal] = useState(false);

  // Store selected location coordinates for mapping
  const [selectedLocations, setSelectedLocations] = useState({
    initial: { lat: null, lon: null },
    final: { lat: null, lon: null },
  });

  // Store locations for map pins
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [pinnedLocation, setPinnedLocation] = useState(null);

  // Store weather data
  const [weatherData, setWeatherData] = useState({});

  // Update search query based on focus and input values
  useEffect(() => {
    if (initialFocused) setSearchQuery(initialLocation);
    else if (finalFocused) setSearchQuery(finalDestination);
  }, [initialLocation, finalDestination, initialFocused, finalFocused]);

  // Update locations
  const updateInitialLocation = (location, coords = null) => {
    setInitialLocation(location);
    if (coords) {
      const newCoords = { lat: coords.latitude, lon: coords.longitude };
      setSelectedLocations((prev) => ({
        ...prev,
        initial: newCoords,
      }));

      // Fetch weather for this location
      fetchWeatherForLocation(coords);
    }
  };

  const updateFinalDestination = (destination, coords = null) => {
    setFinalDestination(destination);
    if (coords) {
      const newCoords = { lat: coords.latitude, lon: coords.longitude };
      setSelectedLocations((prev) => ({
        ...prev,
        final: newCoords,
      }));

      // Fetch weather for this location
      fetchWeatherForLocation(coords);
    }
  };

  // Fetch weather for a location
  const fetchWeatherForLocation = async (coords) => {
    if (!coords) return;

    const normalizedCoords = normalizeCoordinates(coords);
    if (!normalizedCoords) {
      error(CONTEXT, "Invalid coordinates for weather fetch", { coords });
      return;
    }

    const { lat, lon } = normalizedCoords;
    const locationKey = `${lat},${lon}`;

    // Skip if we already have data for this location
    if (
      weatherData[locationKey] &&
      weatherData[locationKey].status !== "loading"
    ) {
      return;
    }

    // Set loading state
    setWeatherData((prev) => ({
      ...prev,
      [locationKey]: { status: "loading" },
    }));

    try {
      info(CONTEXT, "Fetching weather for location", { lat, lon });

      const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
      let temp = getCachedTemperature(cacheKey);

      // If not in cache, fetch it
      if (temp === null) {
        temp = await fetchTemperature(coords);
        if (temp !== null) {
          cacheTemperature(temp, cacheKey);
        }
      }

      // If API failed, use fallback temperature
      if (temp === null) {
        temp = getFallbackTemperature(coords);
        info(CONTEXT, "Using fallback temperature", {
          coords,
          fallbackTemp: temp,
        });

        setWeatherData((prev) => ({
          ...prev,
          [locationKey]: {
            status: "success",
            temperature: temp,
            isFallback: true,
          },
        }));
      } else {
        setWeatherData((prev) => ({
          ...prev,
          [locationKey]: {
            status: "success",
            temperature: temp,
            isFallback: false,
          },
        }));
      }

      info(CONTEXT, "Weather fetched successfully", {
        coords,
        temp,
      });
    } catch (err) {
      error(CONTEXT, "Weather fetch failed", {
        error: err.message,
        coords,
      });

      // Use fallback temperature
      const temp = getFallbackTemperature(coords);
      setWeatherData((prev) => ({
        ...prev,
        [locationKey]: {
          status: "success",
          temperature: temp,
          isFallback: true,
        },
      }));
    }
  };

  // Set current location as source, with reverse geocode
  const setCurrentLocationAsSource = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        let locationName;
        try {
          locationName = await reverseGeocode(latitude, longitude);
        } catch (error) {
          console.error("Error reverse geocoding:", error);
          locationName = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
        }

        const coords = { latitude, longitude };

        // update based on focus
        if (initialFocused) updateInitialLocation(locationName, coords);
        else if (finalFocused) updateFinalDestination(locationName, coords);
        else updateInitialLocation(locationName, coords);

        setSelectedLocation({ ...coords, name: locationName });

        // Fetch weather for current location
        fetchWeatherForLocation(coords);
      },
      (error) => {
        console.error("Error getting current location:", error);
        alert(
          "Unable to get your current location. Please check your browser permissions."
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
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

  // Get weather for a location
  const getWeatherForLocation = (coords) => {
    if (!coords) return null;

    const normalizedCoords = normalizeCoordinates(coords);
    if (!normalizedCoords) return null;

    const { lat, lon } = normalizedCoords;
    const locationKey = `${lat},${lon}`;

    return weatherData[locationKey] || null;
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
        weatherData,

        // setters
        setSearchQuery,
        updateInitialLocation,
        updateFinalDestination,
        setCurrentLocationAsSource,
        setSelectedLocation,
        setPinnedLocation,
        setShowConfirmationModal,

        // actions
        handleInitialFocus,
        handleInitialBlur,
        handleFinalFocus,
        handleFinalBlur,
        swapLocations,

        // weather functions
        fetchWeatherForLocation,
        getWeatherForLocation,

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
