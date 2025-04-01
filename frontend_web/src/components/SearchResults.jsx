"use client";

import { useState, useEffect } from "react";
import "../styles/SearchResults.css";
import { useLocation } from "./LocationContext";
import { fetchPlaces } from "./apis/Nominatim";
import { MapPin } from "lucide-react"; // Import location icon

const SearchResults = ({ accessToken }) => {
  const {
    searchQuery,
    initialFocused,
    finalFocused,
    updateInitialLocation,
    updateFinalDestination,
    setHoveredLocation,
    setSelectedLocation,
  } = useLocation();

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [loadingCurrentLocation, setLoadingCurrentLocation] = useState(false);

  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setNoResults(false);
      return;
    }

    setLoading(true);
    setNoResults(false);

    const fetchLocations = async () => {
      // Add "Cebu" to the search query if not already present
      let enhancedQuery = searchQuery;
      if (!searchQuery.toLowerCase().includes("cebu")) {
        enhancedQuery = `${searchQuery}, Cebu, Philippines`;
      }

      const places = await fetchPlaces(enhancedQuery);
      setResults(places);
      setNoResults(places.length === 0);
      setLoading(false);
    };

    // Debounce the search to avoid too many API calls
    const timer = setTimeout(() => {
      fetchLocations();
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery, accessToken]);

  const handleSelectLocation = (place) => {
    // Create a formatted location string
    const locationName = place.name;

    if (initialFocused) {
      updateInitialLocation(locationName, {
        latitude: place.latitude,
        longitude: place.longitude,
      });
    } else if (finalFocused) {
      updateFinalDestination(locationName, {
        latitude: place.latitude,
        longitude: place.longitude,
      });
    }

    // Set the selected location for the map pin
    setSelectedLocation({
      latitude: place.latitude,
      longitude: place.longitude,
      name: locationName,
    });

    setResults([]);
    setNoResults(false);
    setCurrentLocation(null);
  };

  const handleUseCurrentLocation = () => {
    setLoadingCurrentLocation(true);

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;

          // Reverse geocode to get address from coordinates
          fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${latitude}&lon=${longitude}&format=json`,
            {
              headers: { "User-Agent": "CebuLocationSearchApp" },
            }
          )
            .then((response) => response.json())
            .then((data) => {
              // Create a location object similar to search results
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
              };

              setCurrentLocation(locationObj);

              // Set the selected location for the map pin
              setSelectedLocation({
                latitude: latitude,
                longitude: longitude,
                name: data.display_name,
              });

              setLoadingCurrentLocation(false);
            })
            .catch((error) => {
              console.error("Error getting location name:", error);
              // Use coordinates as fallback
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
              };

              setCurrentLocation(locationObj);

              // Set the selected location for the map pin
              setSelectedLocation({
                latitude: latitude,
                longitude: longitude,
                name: `Current Location (${latitude.toFixed(
                  6
                )}, ${longitude.toFixed(6)})`,
              });

              setLoadingCurrentLocation(false);
            });
        },
        (error) => {
          console.error("Error getting current location:", error);
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

  // Handle mouse enter/leave for location hovering
  const handleLocationHover = (place, isHovering) => {
    if (isHovering) {
      setHoveredLocation({
        latitude: place.latitude,
        longitude: place.longitude,
        name: place.name,
      });
    } else {
      setHoveredLocation(null);
    }
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
                onMouseEnter={() => handleLocationHover(currentLocation, true)}
                onMouseLeave={() => handleLocationHover(currentLocation, false)}
                className="current-location-item"
              >
                <div className="location-icon">📍</div>
                <div className="location-details">
                  <div className="location-main-text">
                    {currentLocation.details.road || "Current Location"}
                  </div>
                  <div className="location-secondary-text">
                    {formatDetailedAddress(currentLocation)}
                  </div>
                </div>
              </li>
            )}

            {/* Show search results */}
            {results.map((place, index) => (
              <li
                key={index}
                onClick={() => handleSelectLocation(place)}
                onMouseEnter={() => handleLocationHover(place, true)}
                onMouseLeave={() => handleLocationHover(place, false)}
              >
                <div className="location-icon">📍</div>
                <div className="location-details">
                  <div className="location-main-text">
                    {place.details.road || place.name.split(",")[0]}
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
              <div className="location-icon">
                <MapPin size={16} className="current-location-icon" />
              </div>
              <div className="location-details">
                <div className="location-secondary-text">
                  or use current location
                </div>
              </div>
            </li>
          )}

          {/* Show no results message if needed */}
          {searchQuery.trim() &&
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
