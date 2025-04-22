// components/route/RouteResults.jsx
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRoute } from "../../contexts/RouteContext";
import { useLocation } from "../../contexts/LocationContext";
import {
  findNearbyRoutes,
  fetchAllRoutes,
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
  } = useRoute();

  const { selectedLocations, initialLocation, finalDestination } =
    useLocation();

  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [totalRoutes, setTotalRoutes] = useState(0);
  const [selectedRoute, setSelectedRoute] = useState(null);

  const fetchRoutes = useCallback(async () => {
    const { initial, final } = selectedLocations;
    if (!initial.lat || !final.lat) return;

    const controller = new AbortController();

    // 1) clear old data + UI
    setRouteSearchResults([]);
    setProgress(0);
    setLoading(true);
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
        controller.signal,
        all
      );
      setRouteSearchResults(routes);
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Error loading nearby routes:", err);
        setRouteSearchResults([]);
      }
    } finally {
      setLoading(false);
    }

    return () => controller.abort();
  }, [selectedLocations, setRouteSearchResults]);

  useEffect(() => {
    if (showRouteResults) {
      fetchRoutes();
    }
  }, [showRouteResults, fetchRoutes]);

  // If not showing results, return null early
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
    // don't hide the panel; keep it open
  };

  const formatDistance = (d) =>
    !d ? "N/A" : d < 1000 ? `${Math.round(d)}m` : `${(d / 1000).toFixed(1)}km`;

  const formatName = (n) => (!n ? "" : n.includes(",") ? n.split(",")[0] : n);

  const originName = formatName(initialLocation) || "Start";
  const destName = formatName(finalDestination) || "End";

  return (
    <div
      className="route-results-panel"
      style={{
        position: "absolute",
        top: 0,
        right: 0,
        width: "33%", // Make it take up a third of the screen
        height: "100vh",
        backgroundColor: "white",
        zIndex: 1000,
        boxShadow: "-2px 0 10px rgba(0, 0, 0, 0.1)",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      {/* Close icon in top left */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          cursor: "pointer",
          zIndex: 1001,
        }}
        onClick={hideRouteResults}
      >
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
          <line x1="18" y1="6" x2="6" y2="18"></line>
          <line x1="6" y1="6" x2="18" y2="18"></line>
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

      <div className="route-list">
        {matchingRoutes.length > 0 ? (
          matchingRoutes.map((route, i) => {
            const color = getRouteColor(route.routeNumber);
            return (
              <div
                key={i}
                className={`route-item ${
                  selectedRoute === route.relationId ? "selected" : ""
                }`}
                style={{ backgroundColor: color }}
                onClick={() => handleRouteSelect(route)}
              >
                <div className="route-item-header">
                  <div className="route-number">
                    {/* Display route number and location instead of relation ID */}
                    <b>{route.routeNumber}</b> <i>{route.locations}</i>
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

      {/* Remove the close button from the footer */}
      <div className="panel-footer">
        {/* Footer content without close button */}
      </div>
    </div>
  );
};

export default RouteResults;
