"use client";

import { FaSearch } from "react-icons/fa";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import "../../styles/SearchBox.css";
import { useLocation } from "../../contexts/LocationContext";
import { useRoute } from "../../contexts/RouteContext";
import { useState, useEffect, useRef } from "react";
import LoadingOverlay from "../loading/LoadingOverlay";
import axios from "axios";

const SearchBox = ({ setIsSearching: setParentIsSearching }) => {
  const {
    initialLocation,
    updateInitialLocation,
    finalDestination,
    updateFinalDestination,
    handleInitialFocus,
    handleInitialBlur,
    handleFinalFocus,
    handleFinalBlur,
    swapLocations,
    selectedLocations,
  } = useLocation();

  const { setRouteSearchResults } = useRoute();

  const [isSearching, setIsSearching] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRoutes, setTotalRoutes] = useState(20); // Default to 20 if API fails

  // Reference to store the abort controller
  const abortControllerRef = useRef(null);

  // Update parent component's isSearching state
  useEffect(() => {
    if (setParentIsSearching) {
      setParentIsSearching(isSearching);
    }
  }, [isSearching, setParentIsSearching]);

  // Fetch the total number of routes when component mounts
  useEffect(() => {
    const fetchRouteCount = async () => {
      try {
        const token = localStorage.getItem("token");
        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/routes/all`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (response.data) {
          setTotalRoutes(response.data.length);
        }
      } catch (error) {
        console.error("Error fetching route count:", error);
        // Keep the default value of 20
      }
    };

    fetchRouteCount();
  }, []);

  const handleSearch = async () => {
    const { initial, final } = selectedLocations;

    // Check if both locations are selected
    if (!initial.lat || !initial.lon || !final.lat || !final.lon) {
      console.log("Please select both initial location and final destination");
      return;
    }

    // Create a new AbortController
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;

    // Start searching
    setIsSearching(true);
    setProgress(0);

    console.log("Searching for routes between your locations...");

    try {
      // For demo purposes, simulate a search with sample data
      // In production, this would be replaced with the actual API call
      const simulateSearch = async () => {
        // Simulate progress updates
        for (let i = 0; i <= 100; i += 10) {
          if (signal.aborted) return null;
          setProgress(i);
          await new Promise((resolve) => setTimeout(resolve, 200));
        }

        // Sample data - in production, this would come from findNearbyRoutes
        return [
          {
            routeNumber: "12D",
            relationId: "12345678",
            distance: 2700,
          },
          {
            routeNumber: "12I",
            relationId: "3203115", // This is the actual relation ID from the screenshot
            distance: 2700,
          },
          {
            routeNumber: "12C",
            relationId: "23456789",
            distance: 2700,
          },
        ];
      };

      const matchingRoutes = await simulateSearch();

      if (!signal.aborted && matchingRoutes) {
        console.log("=== ROUTES THAT MATCH YOUR JOURNEY ===");
        console.log(`Found ${matchingRoutes.length} matching routes:`);
        matchingRoutes.forEach((route, index) => {
          console.log(
            `${index + 1}. Route ${route.routeNumber} (ID: ${route.relationId})`
          );
        });
        console.log("=======================================");

        // Add location names to the routes
        const routesWithNames = matchingRoutes.map((route) => ({
          ...route,
          initialName: initialLocation,
          finalName: finalDestination,
        }));

        // Update the route context with the search results
        setRouteSearchResults(routesWithNames);
      }
    } catch (error) {
      if (!signal.aborted) {
        console.error("Error searching for routes:", error);
      }
    } finally {
      if (!signal.aborted) {
        // Only complete the search if it wasn't cancelled
        handleLoadingComplete();
      }
    }
  };

  const handleLoadingComplete = () => {
    setIsSearching(false);
    abortControllerRef.current = null;
  };

  const handleCancelSearch = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      console.log("Search cancelled by user");
      handleLoadingComplete();
    }
  };

  return (
    <>
      <div
        className="search-box"
        style={{ display: isSearching ? "none" : "block" }}
      >
        <h2>Where would you like to go today?</h2>

        <div className="input-container">
          <div className="inputs">
            <div className="input-row">
              <div className="icon-container">
                <svg
                  width="30"
                  height="30"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_39_2675)">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M15 8.61335C15 9.82975 13.8813 10.815 12.5 10.815C11.1188 10.815 10 9.82975 10 8.61335C10 7.39694 11.1188 6.4117 12.5 6.4117C13.8813 6.4117 15 7.39694 15 8.61335ZM12.5 19.3802C12.5 19.3802 6.25 11.6745 6.25 8.372C6.25 5.33704 9.05375 2.8679 12.5 2.8679C15.9462 2.8679 18.75 5.33704 18.75 8.372C18.75 11.6745 12.5 19.3802 12.5 19.3802ZM12.5 0.66626C7.6675 0.66626 3.75 4.11623 3.75 8.372C3.75 12.6278 12.5 22.6827 12.5 22.6827C12.5 22.6827 21.25 12.6278 21.25 8.372C21.25 4.11623 17.3325 0.66626 12.5 0.66626Z"
                      fill="#FF3B10"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_39_2675">
                      <rect
                        width="30"
                        height="30"
                        fill="white"
                        transform="translate(0 0.147705)"
                      />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Select Initial Location"
                value={initialLocation}
                onChange={(e) => updateInitialLocation(e.target.value)}
                onFocus={handleInitialFocus}
                onBlur={handleInitialBlur}
                onClick={handleInitialFocus}
              />
            </div>
            <div className="input-row">
              <div className="icon-container">
                <svg
                  width="30"
                  height="30"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g clipPath="url(#clip0_39_2675)">
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12.5 10.2964C11.1188 10.2964 10 9.3112 10 8.09479C10 6.87838 11.1188 5.89315 12.5 5.89315C13.8813 5.89315 15 6.87838 15 8.09479C15 9.3112 13.8813 10.2964 12.5 10.2964ZM12.5 0.147705C7.6675 0.147705 3.75 3.59768 3.75 7.85345C3.75 12.1092 12.5 22.1641 12.5 22.1641C12.5 22.1641 21.25 12.1092 21.25 7.85345C21.25 3.59768 17.3325 0.147705 12.5 0.147705Z"
                      fill="#FF3B10"
                    />
                  </g>
                  <defs>
                    <clipPath id="clip0_39_2675">
                      <rect
                        width="30"
                        height="30"
                        fill="white"
                        transform="translate(0 0.147705)"
                      />
                    </clipPath>
                  </defs>
                </svg>
              </div>
              <input
                type="text"
                placeholder="Select Final Destination"
                value={finalDestination}
                onChange={(e) => updateFinalDestination(e.target.value)}
                onFocus={handleFinalFocus}
                onBlur={handleFinalBlur}
                onClick={handleFinalFocus}
              />
            </div>
          </div>

          <button className="swap-btn" onClick={swapLocations}>
            <FaArrowRightArrowLeft className="swap-icon" />
          </button>
        </div>

        <button
          className="search-btn"
          onClick={handleSearch}
          disabled={isSearching}
        >
          <FaSearch className="search-icon" /> SEARCH
        </button>
      </div>

      {isSearching && (
        <LoadingOverlay
          isVisible={isSearching}
          progress={progress}
          totalRoutes={totalRoutes}
          onComplete={handleLoadingComplete}
          onCancel={handleCancelSearch}
        />
      )}
    </>
  );
};

export default SearchBox;
