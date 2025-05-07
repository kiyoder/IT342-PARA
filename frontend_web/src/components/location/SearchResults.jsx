"use client";

import { useState, useEffect } from "react";
import "../../styles/SearchResults.css";
import { useLocation } from "../../contexts/LocationContext";
import { fetchPlaces } from "../../services/api/Nominatim";
import {
  fetchTemperature,
  getCachedTemperature,
  cacheTemperature,
  testWeatherService,
  getFallbackTemperature,
} from "../../services/api/WeatherService";
import { error, info } from "../../services/utils/logger";
import Fuse from "fuse.js"; // Import Fuse for fuzzy matching

const CONTEXT = "SearchResults";

const SearchResults = ({ onLocationSelected }) => {
  const { searchQuery, setSelectedLocation, initialFocused, finalFocused } =
    useLocation();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);
  const [userPosition, setUserPosition] = useState(null);
  const [weatherData, setWeatherData] = useState({});
  const [diagnosticResult, setDiagnosticResult] = useState(null);
  const [showDiagnostics, setShowDiagnostics] = useState(false);

  // Get user's position when component mounts
  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setUserPosition({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (err) => {
          error(CONTEXT, "Error getting user position", err);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    }
  }, []);

  useEffect(() => {
    // Add a null check before calling trim()
    if (!searchQuery || !searchQuery.trim()) {
      setResults([]);
      setNoResults(false);
      return;
    }

    setLoading(true);
    setNoResults(false);

    const fetchLocations = async () => {
      let enhancedQuery = searchQuery.trim().replace(/\.+/g, ""); // Remove excessive dots

      if (!enhancedQuery.toLowerCase().includes("cebu")) {
        enhancedQuery = `${enhancedQuery}, Cebu, Philippines`;
      }

      info(CONTEXT, "Fetching places", { query: enhancedQuery });

      // Fetch initial set of places
      const places = await fetchPlaces(enhancedQuery, {
        lat: userPosition?.latitude,
        lon: userPosition?.longitude,
        radius: 5000, // 5km radius
      });

      info(CONTEXT, "Places fetched", { count: places.length });

      // If no results, attempt some alternative queries
      if (places.length === 0) {
        const altQueries = [
          enhancedQuery.replace(/\bst\b/gi, "street"), // Convert "st" to "street"
          enhancedQuery.replace(/\bave\b/gi, "avenue"), // Convert "ave" to "avenue"
          enhancedQuery.split(" ").reverse().join(" "), // Reverse order (e.g., "A. Lopez" -> "Lopez A.")
          enhancedQuery.replace(/\b([a-z])\./gi, "$1"), // Remove dots in abbreviations ("A. Lopez" -> "A Lopez")
        ];

        for (const altQuery of altQueries) {
          info(CONTEXT, "Trying alternative query", { altQuery });
          const altPlaces = await fetchPlaces(altQuery);
          if (altPlaces.length > 0) {
            // Optionally, you could also run fuzzy matching here
            info(CONTEXT, "Found results with alternative query", {
              altQuery,
              count: altPlaces.length,
            });
            setResults(altPlaces);
            setLoading(false);
            return;
          }
        }
      }

      // If user position is available, calculate distance for each place
      if (userPosition) {
        places.forEach((place) => {
          const lat = place.latitude ?? parseFloat(place.lat);
          const lon = place.longitude ?? parseFloat(place.lon);
          place.distance = calculateDistance(
            userPosition.latitude,
            userPosition.longitude,
            lat,
            lon
          );
        });
      }

      // Use Fuse.js for fuzzy matching/ranking
      if (places.length > 0) {
        const fuseOptions = {
          keys: ["name", "details.road"],
          threshold: 0.3, // adjust threshold as needed (lower is stricter)
        };
        const fuse = new Fuse(places, fuseOptions);
        const fuseResults = fuse.search(searchQuery);
        if (fuseResults.length > 0) {
          info(CONTEXT, "Fuzzy search results", { count: fuseResults.length });
          setResults(fuseResults.map((result) => result.item));
        } else {
          // fallback to original order if fuzzy search gives no results
          info(CONTEXT, "Using original results (no fuzzy matches)", {
            count: places.length,
          });
          setResults(places);
        }
      } else {
        setResults([]);
      }

      setNoResults(places.length === 0);
      setLoading(false);
    };

    // Debounce the search to avoid too many API calls
    const timer = setTimeout(() => {
      fetchLocations();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, userPosition]);

  // Fetch weather data for all places
  useEffect(() => {
    const fetchWeatherForResults = async () => {
      if (!results.length) return;

      info(CONTEXT, "Fetching weather for results", { count: results.length });
      // Prepare batch updates
      const updatedWeather = { ...weatherData };

      // Mark all as loading
      for (const place of results) {
        const lat = place.latitude ?? parseFloat(place.lat);
        const lon = place.longitude ?? parseFloat(place.lon);
        const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
        updatedWeather[cacheKey] = { status: "loading" };
      }
      setWeatherData(updatedWeather);

      // Fetch each
      for (const place of results) {
        const lat = place.latitude ?? parseFloat(place.lat);
        const lon = place.longitude ?? parseFloat(place.lon);
        const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;

        let temp = getCachedTemperature(cacheKey);
        if (temp === null) {
          temp = await fetchTemperature(lat, lon);
          if (temp !== null) cacheTemperature(temp, cacheKey);
        }

        if (temp === null) {
          temp = getFallbackTemperature(lat, lon);
          info(CONTEXT, "Using fallback temperature", {
            name: place.name,
            fallbackTemp: temp,
          });
        }

        updatedWeather[cacheKey] = {
          status: "success",
          temperature: temp,
          isFallback: temp === getFallbackTemperature(lat, lon),
        };
      }

      setWeatherData({ ...updatedWeather });
    };

    fetchWeatherForResults();
  }, [results]);

  // Fetch weather for current location if set
  useEffect(() => {
    const fetchCurrentLocationWeather = async () => {
      if (!currentLocation) return;

      const lat =
        currentLocation.latitude != null
          ? currentLocation.latitude
          : parseFloat(currentLocation.lat);
      const lon =
        currentLocation.longitude != null
          ? currentLocation.longitude
          : parseFloat(currentLocation.lon);
      const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;

      // Set loading state
      setWeatherData((prev) => ({
        ...prev,
        [cacheKey]: { status: "loading" },
      }));

      try {
        let temp = getCachedTemperature(cacheKey);
        if (temp === null) {
          temp = await fetchTemperature(lat, lon);
          if (temp !== null) cacheTemperature(temp, cacheKey);
        }
        setWeatherData((prev) => ({
          ...prev,
          [cacheKey]: { status: "success", temperature: temp },
        }));
      } catch {
        setWeatherData((prev) => ({
          ...prev,
          [cacheKey]: { status: "failed" },
        }));
      }
    };

    if (currentLocation) {
      fetchCurrentLocationWeather();
    }
  }, [currentLocation]);

  // Calculate distance between two coordinates in meters
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    // Convert coordinates from degrees to radians
    const toRad = (value) => (value * Math.PI) / 180;

    const R = 6371e3; // Earth's radius in meters
    const φ1 = toRad(lat1);
    const φ2 = toRad(lat2);
    const Δφ = toRad(lat2 - lat1);
    const Δλ = toRad(lon2 - lon1);

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  };

  const handleSelectLocation = (place) => {
    // Set the selected location for the map pin temporarily
    setSelectedLocation({
      latitude: place.latitude,
      longitude: place.longitude,
      name: place.name,
      // Add a property to indicate which field this is for
      isInitial: initialFocused,
      isFinal: finalFocused,
    });

    // Call the parent component's handler to show confirmation
    if (onLocationSelected) {
      onLocationSelected({
        ...place,
        isInitial: initialFocused,
        isFinal: finalFocused,
      });
    }
  };

  const handleUseCurrentLocation = () => {
    setLoadingCurrentLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          setUserPosition({ latitude, longitude });

          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            { headers: { "User-Agent": "CebuLocationSearchApp" } }
          )
            .then((response) => response.json())
            .then((data) => {
              const locationObj = {
                name: data.display_name,
                latitude,
                longitude,
                type: "current_location",
                details: {
                  road: data.address?.road || "",
                  suburb:
                    data.address?.suburb || data.address?.neighbourhood || "",
                  city: data.address?.city || data.address?.town || "Cebu City",
                  postcode: data.address?.postcode || "6000",
                  housenumber: data.address?.house_number || "",
                },
                distance: 0,
              };

              setCurrentLocation(locationObj);

              if (onLocationSelected) {
                onLocationSelected(locationObj);
              }

              setLoadingCurrentLocation(false);
            })
            .catch((_) => {
              console.error("Error getting location name:", _);
              const locationObj = {
                name: `Current Location (${latitude.toFixed(
                  6
                )}, ${longitude.toFixed(6)})`,
                latitude,
                longitude,
                type: "current_location",
                details: {
                  road: "Current Location",
                  city: "Cebu City",
                  postcode: "6000",
                },
                distance: 0,
              };
              setCurrentLocation(locationObj);
              if (onLocationSelected) onLocationSelected(locationObj);
              setLoadingCurrentLocation(false);
            });
        },
        (err) => {
          console.error("Error getting current location:", err);
          setLoadingCurrentLocation(false);
          alert(
            "Unable to get your current location. Please check your browser permissions."
          );
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      setLoadingCurrentLocation(false);
      alert("Geolocation is not supported by your browser.");
    }
  };

  // Format the address in a Google Maps style
  const formatDetailedAddress = (place) => {
    const parts = [];
    if (place.details.housenumber) {
      parts.push(`${place.details.housenumber} ${place.details.road || ""}`);
    } else if (place.details.road) {
      parts.push(place.details.road);
    }
    if (place.details.suburb) parts.push(place.details.suburb);
    const cityPart = [];
    if (place.details.city) cityPart.push(place.details.city);
    else if (place.details.town) cityPart.push(place.details.town);
    else if (place.details.village) cityPart.push(place.details.village);
    else cityPart.push("Cebu City");
    if (place.details.postcode) cityPart.push(place.details.postcode);
    else cityPart.push("6000");
    parts.push(cityPart.join(" "), "Cebu");
    return parts.filter(Boolean).join(", ");
  };

  // Get weather display text for a location
  const getWeatherDisplay = (place) => {
    const lat = place.latitude ?? parseFloat(place.lat);
    const lon = place.longitude ?? parseFloat(place.lon);
    const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    const data = weatherData[cacheKey];
    if (!data) return "";
    if (data.status === "loading") return " • Weather: Loading";
    if (data.status === "failed") return " • Weather: Failed";
    return data.isFallback
      ? ` • ~${data.temperature}°C (est.)`
      : ` • ${data.temperature}°C`;
  };

  const runDiagnostics = async () => {
    setDiagnosticResult({ status: "running" });
    try {
      const testResult = await testWeatherService();
      const networkStatus = navigator.onLine ? "online" : "offline";
      let storageStatus = "available";
      try {
        localStorage.setItem("test", "test");
        localStorage.removeItem("test");
      } catch {
        storageStatus = "unavailable";
      }
      setDiagnosticResult({
        status: "complete",
        timestamp: new Date().toISOString(),
        weatherTest: testResult,
        network: networkStatus,
        storage: storageStatus,
        userAgent: navigator.userAgent,
        screenSize: `${window.innerWidth}x${window.innerHeight}`,
      });
    } catch (err) {
      setDiagnosticResult({ status: "error", error: err.message });
    }
  };

  const renderDiagnostics = () => {
    if (!showDiagnostics) {
      return (
        <div className="diagnostics-toggle">
          <button
            onClick={() => setShowDiagnostics(true)}
            style={{
              padding: "5px 10px",
              fontSize: "12px",
              backgroundColor: "#f0f0f0",
              border: "1px solid #ccc",
              borderRadius: "4px",
              marginTop: "10px",
            }}
          >
            Show Diagnostics
          </button>
        </div>
      );
    }
    return (
      <div
        className="diagnostics-panel"
        style={{
          marginTop: "20px",
          padding: "10px",
          backgroundColor: "#f5f5f5",
          borderRadius: "8px",
          fontSize: "14px",
        }}
      >
        <h3 style={{ margin: "0 0 10px 0" }}>Weather Service Diagnostics</h3>
        <button
          onClick={runDiagnostics}
          style={{
            padding: "8px 12px",
            backgroundColor: "#007bff",
            color: "white",
            border: "none",
            borderRadius: "4px",
            marginRight: "10px",
          }}
        >
          Run Diagnostics
        </button>
        <button
          onClick={() => setShowDiagnostics(false)}
          style={{
            padding: "8px 12px",
            backgroundColor: "#6c757d",
            color: "white",
            border: "none",
            borderRadius: "4px",
          }}
        >
          Hide
        </button>
        {diagnosticResult && (
          <div
            style={{
              marginTop: "15px",
              backgroundColor: "white",
              padding: "10px",
              borderRadius: "4px",
              border: "1px solid #ddd",
              maxHeight: "300px",
              overflow: "auto",
            }}
          >
            <p>
              <strong>Timestamp:</strong> {diagnosticResult.timestamp}
            </p>
            <p>
              <strong>Network:</strong> {diagnosticResult.network}
            </p>
            <p>
              <strong>Storage:</strong> {diagnosticResult.storage}
            </p>
            <p>
              <strong>Weather Test:</strong>{" "}
              {diagnosticResult.weatherTest.success
                ? `Success (${diagnosticResult.weatherTest.temperature}°C)`
                : `Failed (${
                    diagnosticResult.weatherTest.message ||
                    diagnosticResult.weatherTest.error
                  })`}
            </p>
            <p>
              <strong>User Agent:</strong> {diagnosticResult.userAgent}
            </p>
            <p>
              <strong>Screen Size:</strong> {diagnosticResult.screenSize}
            </p>
          </div>
        )}
      </div>
    );
  };

  if (
    !loading &&
    !loadingCurrentLocation &&
    results.length === 0 &&
    !noResults &&
    !currentLocation
  ) {
    return <div>{renderDiagnostics()}</div>;
  }

  return (
    <div className="search-results">
      {loading ? (
        <div className="loading">Searching locations in Cebu...</div>
      ) : loadingCurrentLocation ? (
        <div className="loading">Getting your current location...</div>
      ) : (
        <>
          <ul>
            {/* Show current location at the top if available */}
            {currentLocation && (
              <li
                key="current-location"
                onClick={() => handleSelectLocation(currentLocation)}
                className="current-location-item"
              >
                <div className="location-icon">📍</div>
                <div className="location-details">
                  <div className="location-main-text">
                    {currentLocation.details.road || "Current Location"}
                    <div className="location-meta">
                      <span className="distance-text">
                        {currentLocation.distance < 1000
                          ? `${Math.round(currentLocation.distance)}m away`
                          : `${(currentLocation.distance / 1000).toFixed(
                              1
                            )}km away`}
                      </span>
                      <span className="weather-text">
                        {getWeatherDisplay(currentLocation)}
                      </span>
                    </div>
                  </div>
                  <div className="location-secondary-text">
                    {formatDetailedAddress(currentLocation)}
                  </div>
                </div>
              </li>
            )}

            {/* Show search results */}
            {results &&
              results.map((place, index) => (
                <li key={index} onClick={() => handleSelectLocation(place)}>
                  <div className="location-icon">📍</div>
                  <div className="location-details">
                    <div className="location-main-text">
                      {place.name.split(",")[0]}
                      <div className="location-meta">
                        <span className="distance-text">
                          {place.distance !== undefined
                            ? place.distance < 1000
                              ? `${Math.round(place.distance)}m away`
                              : `${(place.distance / 1000).toFixed(1)}km away`
                            : ""}
                        </span>
                        <span className="weather-text">
                          {getWeatherDisplay(place)}
                        </span>
                      </div>
                    </div>
                    <div className="location-secondary-text">
                      {formatDetailedAddress(place)}
                    </div>
                  </div>
                </li>
              ))}
          </ul>

          {/* Always show the "use current location" option */}
          {!currentLocation && (
            <li
              className="use-current-location"
              onClick={handleUseCurrentLocation}
            >
              <div className="location-details">
                <div
                  className="location-secondary-text"
                  style={{ paddingLeft: "20px" }}
                >
                  or use current location
                </div>
              </div>
            </li>
          )}

          {/* Show no results message if needed */}
          {searchQuery &&
            searchQuery.trim() &&
            noResults &&
            results.length === 0 &&
            !currentLocation && (
              <div className="no-results">
                No locations found in Cebu. Try a different search term.
              </div>
            )}

          {renderDiagnostics()}
        </>
      )}
    </div>
  );
};

export default SearchResults;
