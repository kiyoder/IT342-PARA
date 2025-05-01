"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "../contexts/LocationContext";
import { useRoute } from "../contexts/RouteContext";
import TopSearchBar from "../components/location/TopSearchBar";
import LoadingOverlay from "../components/loading/LoadingOverlay";
import RouteLoadingSpinner from "../components/loading/RouteLoadingSpinner";
import { getSavedRoutes, deleteSavedRoute } from "../services/api/RouteService";
import "../styles/SavedRoutes.css";
import ProfileMenu from "../components/layout/ProfileMenu";

export default function SavedRoutes() {
  const navigate = useNavigate();
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [routeLoading, setRouteLoading] = useState(false);
  const [error, setError] = useState(null);
  const [deletingRouteId, setDeletingRouteId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [selectedRouteId, setSelectedRouteId] = useState(null);

  const { reverseGeocode, updateInitialLocation, updateFinalDestination } =
    useLocation();
  const { setRouteNumber, setRelationId, setShowJeepneyRoute } = useRoute();

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  // Fetch and enrich saved routes
  useEffect(() => {
    const fetchSavedRoutes = async () => {
      if (!isAuthenticated) return;
      try {
        const data = await getSavedRoutes();
        const enriched = await Promise.all(
          data.map(async (route) => {
            const fromName = await reverseGeocode(
              route.initialLat,
              route.initialLon
            );
            const toName = await reverseGeocode(route.finalLat, route.finalLon);
            return { ...route, fromName, toName };
          })
        );
        setSavedRoutes(enriched);
      } catch (err) {
        console.error("Error fetching saved routes:", err);
        if (err.message.includes("Authentication required")) {
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        } else {
          setError("Failed to load saved routes. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };
    fetchSavedRoutes();
  }, [isAuthenticated, reverseGeocode]);

  const handleRouteClick = async (route) => {
    setSelectedRouteId(route.relationId);
    setRouteLoading(true);

    try {
      // Set the coordinates for the route
      updateInitialLocation(route.fromName, {
        latitude: route.initialLat,
        longitude: route.initialLon,
      });

      updateFinalDestination(route.toName, {
        latitude: route.finalLat,
        longitude: route.finalLon,
      });

      // Set the relation ID for the route
      setRelationId(route.relationId);

      // Fetch route details
      const token = localStorage.getItem("token");
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/routes/lookup?relationId=${
          route.relationId
        }`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (!response.ok) {
        throw new Error(`Failed to fetch route: ${response.statusText}`);
      }

      const data = await response.json();

      if (data.routeNumber) {
        setRouteNumber(data.routeNumber);
        setShowJeepneyRoute(true);
      }

      // Navigate to home page to display the route
      navigate("/");
    } catch (err) {
      console.error("Error loading route:", err);
      alert("Could not load the selected route. Please try again.");
    } finally {
      setRouteLoading(false);
    }
  };

  const handleDeleteRoute = async (relationId, e) => {
    e.stopPropagation();
    if (!window.confirm("Delete this saved route?")) return;
    setDeletingRouteId(relationId);
    try {
      await deleteSavedRoute(relationId);
      setSavedRoutes((prev) => prev.filter((r) => r.relationId !== relationId));
    } catch (err) {
      console.error(err);
      alert("Could not delete route");
    } finally {
      setDeletingRouteId(null);
    }
  };

  const formatDate = (d) =>
    new Date(d).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  return (
    <div className="saved-routes-container">
      <TopSearchBar />
      <ProfileMenu />

      <div className="saved-routes-content">
        <h1 className="saved-routes-title">Saved Routes</h1>

        {loading ? (
          <div className="loading-container">
            <LoadingOverlay isVisible />
          </div>
        ) : error ? (
          <div className="error-message">
            <p>{error}</p>
            <button
              className="retry-btn"
              onClick={() => window.location.reload()}
            >
              Retry
            </button>
          </div>
        ) : savedRoutes.length === 0 ? (
          <div className="no-routes-message">
            <p>No saved routes yet</p>
            <button
              className="search-new-route-btn"
              onClick={() => navigate("/")}
            >
              Search routes
            </button>
          </div>
        ) : (
          <div className="saved-routes-list">
            {savedRoutes.map((route) => (
              <div
                key={route.relationId}
                className={`saved-route-card ${
                  selectedRouteId === route.relationId ? "selected" : ""
                }`}
                onClick={() => handleRouteClick(route)}
              >
                <div className="route-locations">
                  <div className="location from-location">
                    <div className="location-marker from-marker"></div>
                    <div className="location-details">
                      <span className="location-label">FROM</span>
                      <span className="location-name">{route.fromName}</span>
                    </div>
                  </div>

                  <div className="location to-location">
                    <div className="location-marker to-marker"></div>
                    <div className="location-details">
                      <span className="location-label">TO</span>
                      <span className="location-name">{route.toName}</span>
                    </div>
                  </div>
                </div>

                <div className="route-footer">
                  <span className="route-date">
                    {formatDate(route.createdAt)}
                  </span>
                  <button
                    className={`delete-btn ${
                      deletingRouteId === route.relationId ? "deleting" : ""
                    }`}
                    onClick={(e) => handleDeleteRoute(route.relationId, e)}
                    disabled={deletingRouteId === route.relationId}
                  >
                    {deletingRouteId === route.relationId
                      ? "Deleting..."
                      : "Delete"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {routeLoading && (
          <div className="route-loading-overlay">
            <RouteLoadingSpinner message="Loading route..." />
          </div>
        )}
      </div>
    </div>
  );
}
