// components/route/RouteResults.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRoute } from "../../contexts/RouteContext";
import { useLocation } from "../../contexts/LocationContext";
import {
  findNearbyRoutes,
  fetchAllRoutes,
  getSavedRoutes,
  saveRoute,
  deleteSavedRoute,
} from "../../services/api/RouteService";
import LoadingOverlay from "../loading/LoadingOverlay";
import "../../styles/RouteResults.css";

const RouteResults = () => {
  const {
    matchingRoutes,
    showRouteResults,
    setRouteSearchResults,
    setRouteNumber,
    setRelationId,
    setShowJeepneyRoute,
    hideRouteResults,
    getRouteColor,
    resetRouteColors,
  } = useRoute();

  const { selectedLocations, initialLocation, finalDestination } =
    useLocation();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRoutes, setTotalRoutes] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState(null);
  const [savedRoutes, setSavedRoutes] = useState({});
  const [savingRoute, setSavingRoute] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [error, setError] = useState(null);

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  // Fetch saved routes on component mount if authenticated
  useEffect(() => {
    const fetchSavedRoutes = async () => {
      if (!isAuthenticated) return;

      try {
        const data = await getSavedRoutes();
        const savedMap = {};
        data.forEach((route) => {
          savedMap[route.relationId] = true;
        });
        setSavedRoutes(savedMap);
      } catch (error) {
        console.error("Error fetching saved routes:", error);
        if (error.message.includes("Authentication required")) {
          // Token expired or invalid
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        }
      }
    };

    if (showRouteResults && isAuthenticated) {
      fetchSavedRoutes();
    }
  }, [showRouteResults, isAuthenticated]);

  const fetchRoutes = useCallback(async () => {
    const { initial, final } = selectedLocations;
    if (!initial.lat || !final.lat) return;

    const controller = new AbortController();

    // 1) clear old data + UI
    resetRouteColors();
    setRouteSearchResults([]);
    setProgress(0);
    setLoading(true);
    setError(null);

    try {
      // 2) fetch all routes once
      const all = await fetchAllRoutes();
      setTotalRoutes(all.length);

      // 3) scan for nearby routes, reporting cumulative progress
      const routes = await findNearbyRoutes(
        initial.lat,
        initial.lon,
        final.lat,
        final.lon,
        500,
        setProgress,
        controller.signal
      );
      setRouteSearchResults(routes);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error loading nearby routes:", err);
        setRouteSearchResults([]);
        setError("Failed to load routes. Please try again.");
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [selectedLocations, setRouteSearchResults, resetRouteColors]);

  useEffect(() => {
    if (showRouteResults) {
      fetchRoutes();
    }
  }, [showRouteResults, fetchRoutes]);

  // Early exit if not showing results
  if (!showRouteResults) return null;

  // While scanning, show only the overlay
  if (loading) {
    return (
      <LoadingOverlay
        isVisible={true}
        progress={progress}
        totalRoutes={totalRoutes}
        onCancel={() => setLoading(false)}
      />
    );
  }

  const handleRouteSelect = (route) => {
    setRouteNumber(route.routeNumber);
    setRelationId(route.relationId);
    setShowJeepneyRoute(true);
    setSelectedRoute(route.relationId);
    // keep the panel open
  };

  const handleSaveRoute = async (e, route) => {
    e.stopPropagation(); // Prevent triggering the parent click event

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
      alert("Please log in to save routes");
      // You can redirect to login page here
      return;
    }

    const relationId = route.relationId;
    setSavingRoute(relationId);

    try {
      if (savedRoutes[relationId]) {
        // Delete the saved route
        await deleteSavedRoute(relationId);
        setSavedRoutes((prev) => {
          const updated = { ...prev };
          delete updated[relationId];
          return updated;
        });
      } else {
        // Save the route
        const { initial, final } = selectedLocations;

        const routeData = {
          relationId: relationId,
          initialLat: initial.lat,
          initialLon: initial.lon,
          finalLat: final.lat,
          finalLon: final.lon,
        };

        await saveRoute(routeData);
        setSavedRoutes((prev) => ({
          ...prev,
          [relationId]: true,
        }));
      }
    } catch (error) {
      console.error("Error saving/deleting route:", error);
      if (error.message.includes("Authentication required")) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
        alert("Your session has expired. Please log in again.");
      }
    } finally {
      setSavingRoute(null);
    }
  };

  const formatDistance = (d) => {
    if (d == null) return "Travel distance: Calculating...";
    return d < 1000
      ? `Travel distance: ${Math.round(d)}m`
      : `Travel distance: ${(d / 1000).toFixed(1)}km`;
  };

  const formatName = (n) => (!n ? "" : n.includes(",") ? n.split(",")[0] : n);

  const originName = formatName(initialLocation) || "Start";
  const destName = formatName(finalDestination) || "End";

  return (
    <div className="route-results-panel">
      {/* Close icon */}
      <div className="close-icon" onClick={hideRouteResults}>
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </div>

      <div className="panel-header">
        <h2>Jeepney Code Suggestions</h2>
      </div>

      <div className="journey-info">
        <span>{originName}</span>
        <span className="direction-icon">▶▶</span>
        <span>{destName}</span>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="route-list">
        {matchingRoutes.length > 0 ? (
          matchingRoutes.map((route, i) => {
            const color = getRouteColor(route.routeNumber);
            const isSaved = savedRoutes[route.relationId] || false;
            const isSaving = savingRoute === route.relationId;

            return (
              <div
                key={i}
                className={`route-item ${
                  selectedRoute === route.relationId ? "selected" : ""
                }`}
                style={{ backgroundColor: color, position: "relative" }}
                onClick={() => handleRouteSelect(route)}
              >
                <div
                  className="save-button"
                  onClick={(e) => handleSaveRoute(e, route)}
                  style={{
                    position: "absolute",
                    bottom: "60%",
                    top: "40%",
                    right: "20px",
                    cursor: "pointer",
                    opacity: isSaving ? 0.5 : 1,
                  }}
                  aria-label={isSaved ? "Unsave route" : "Save route"}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill={isSaved ? "white" : "none"}
                    stroke="white"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"></path>
                  </svg>
                </div>
                <div className="route-item-header">
                  <div className="route-number">
                    <b>{route.routeNumber}</b>{" "}
                    {route.locations && <i>{route.locations}</i>}
                  </div>
                </div>
                <div className="route-distance">
                  {formatDistance(route.distance)}
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-routes-message">
            No routes found for your journey. Try adjusting your locations.
          </div>
        )}
      </div>

      <div className="panel-footer" />
    </div>
  );
};

export default RouteResults;
