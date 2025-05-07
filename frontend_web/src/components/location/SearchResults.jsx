"use client";

import { useState, useEffect } from "react";
import "../../styles/SearchResults.css";
import { useLocation } from "../../contexts/LocationContext";
import { fetchPlaces } from "../../services/api/Nominatim";
import {
  fetchTemperature,
  getCachedTemperature,
  cacheTemperature,
} from "../../services/api/WeatherService";
import Fuse from "fuse.js"; // Import Fuse for fuzzy matching

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
        (_) => {
          console.error("Error getting user position:", _);
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

      // Fetch initial set of places
      const places = await fetchPlaces(enhancedQuery, {
        lat: userPosition?.latitude,
        lon: userPosition?.longitude,
        radius: 5000, // 5km radius
      });

      // If no results, attempt some alternative queries
      if (places.length === 0) {
        const altQueries = [
          enhancedQuery.replace(/\bst\b/gi, "street"), // Convert "st" to "street"
          enhancedQuery.replace(/\bave\b/gi, "avenue"), // Convert "ave" to "avenue"
          enhancedQuery.split(" ").reverse().join(" "), // Reverse order (e.g., "A. Lopez" -> "Lopez A.")
          enhancedQuery.replace(/\b([a-z])\./gi, "$1"), // Remove dots in abbreviations ("A. Lopez" -> "A Lopez")
        ];

        for (const altQuery of altQueries) {
          const altPlaces = await fetchPlaces(altQuery);
          if (altPlaces.length > 0) {
            // Optionally, you could also run fuzzy matching here
            setResults(altPlaces);
            setLoading(false);
            return;
          }
        }
      }

      // If user position is available, calculate distance for each place
      if (userPosition) {
        places.forEach((place) => {
          place.distance = calculateDistance(
            userPosition.latitude,
            userPosition.longitude,
            place.latitude,
            place.longitude
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
          setResults(fuseResults.map((result) => result.item));
        } else {
          // fallback to original order if fuzzy search gives no results
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

      const newWeatherData = { ...weatherData };

      for (const place of results) {
        const locationKey = `${place.latitude},${place.longitude}`;

        // Set loading state for this location
        newWeatherData[locationKey] = { status: "loading" };
        setWeatherData({ ...newWeatherData });

        try {
          // Try cache first
          const cacheKey = `${place.latitude.toFixed(
            2
          )},${place.longitude.toFixed(2)}`;
          let temp = getCachedTemperature(cacheKey);

          // If not in cache, fetch it
          if (temp === null) {
            temp = await fetchTemperature(place.latitude, place.longitude);
            if (temp !== null) {
              cacheTemperature(temp, cacheKey);
            }
          }

          newWeatherData[locationKey] = {
            status: "success",
            temperature: temp,
          };
        } catch {
          newWeatherData[locationKey] = { status: "failed" };
        }
      }

      setWeatherData(newWeatherData);
    };

    fetchWeatherForResults();
  }, [results, weatherData]);

  // Fetch weather for current location if set
  useEffect(() => {
    const fetchCurrentLocationWeather = async () => {
      if (!currentLocation) return;

      const locationKey = `${currentLocation.latitude},${currentLocation.longitude}`;

      // Set loading state
      setWeatherData((prev) => ({
        ...prev,
        [locationKey]: { status: "loading" },
      }));

      try {
        // Try cache first
        const cacheKey = `${currentLocation.latitude.toFixed(
          2
        )},${currentLocation.longitude.toFixed(2)}`;
        let temp = getCachedTemperature(cacheKey);

        // If not in cache, fetch it
        if (temp === null) {
          temp = await fetchTemperature(
            currentLocation.latitude,
            currentLocation.longitude
          );
          if (temp !== null) {
            cacheTemperature(temp, cacheKey);
          }
        }

        setWeatherData((prev) => ({
          ...prev,
          [locationKey]: {
            status: "success",
            temperature: temp,
          },
        }));
      } catch {
        setWeatherData((prev) => ({
          ...prev,
          [locationKey]: { status: "failed" },
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
    const distance = R * c;

    return distance;
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
      // Pass the focus information to the parent
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

          // Update user position state
          setUserPosition({
            latitude: latitude,
            longitude: longitude,
          });

          // Reverse geocode to get address from coordinates
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: { "User-Agent": "CebuLocationSearchApp" },
            }
          )
            .then((response) => response.json())
            .then((data) => {
              const locationObj = {
                name: data.display_name,
                latitude: latitude,
                longitude: longitude,
                type: "current_location",
                details: {
                  road: data.address?.road || "",
                  suburb:
                    data.address?.suburb || data.address?.neighbourhood || "",
                  city: data.address?.city || data.address?.town || "Cebu City",
                  postcode: data.address?.postcode || "6000",
                  housenumber: data.address?.house_number || "",
                },
                distance: 0, // Current location is always 0m away
              };

              setCurrentLocation(locationObj);

              // Call the parent component's handler to show confirmation
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
                latitude: latitude,
                longitude: longitude,
                type: "current_location",
                details: {
                  road: "Current Location",
                  city: "Cebu City",
                  postcode: "6000",
                },
                distance: 0,
              };

              setCurrentLocation(locationObj);

              // Call the parent component's handler to show confirmation
              if (onLocationSelected) {
                onLocationSelected(locationObj);
              }

              setLoadingCurrentLocation(false);
            });
        },
        (_) => {
          console.error("Error getting current location:", _);
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

    // Add street number and road if available
    if (place.details.housenumber) {
      parts.push(`${place.details.housenumber} ${place.details.road || ""}`);
    } else if (place.details.road) {
      parts.push(place.details.road);
    }

    // Add neighborhood/suburb if available
    if (place.details.suburb) {
      parts.push(place.details.suburb);
    }

    // Add city and postal code if available
    const cityPart = [];
    if (place.details.city) {
      cityPart.push(place.details.city);
    } else if (place.details.town) {
      cityPart.push(place.details.town);
    } else if (place.details.village) {
      cityPart.push(place.details.village);
    } else {
      cityPart.push("Cebu City");
    }

    if (place.details.postcode) {
      cityPart.push(place.details.postcode);
    } else {
      cityPart.push("6000");
    }

    parts.push(cityPart.join(" "));
    // Add province
    parts.push("Cebu");

    return parts.filter(Boolean).join(", ");
  };

  // Get weather display text for a location
  const getWeatherDisplay = (place) => {
    const locationKey = `${place.latitude},${place.longitude}`;
    const data = weatherData[locationKey];

    if (!data) return "";

    if (data.status === "loading") {
      return " • Weather: Loading";
    } else if (data.status === "failed") {
      return " • Weather: Failed";
    } else if (data.temperature !== null) {
      return ` • ${data.temperature}°C`;
    }

    return "";
  };

  // Only render if we have results, are loading, or have no results but user is searching
  // or if we're showing current location
  if (
    !loading &&
    !loadingCurrentLocation &&
    results.length === 0 &&
    !noResults &&
    !currentLocation
  ) {
    return null;
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
        </>
      )}
    </div>
  );
};

export default SearchResults;
