"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "../contexts/LocationContext";
import { useRoute } from "../contexts/RouteContext";
import TopSearchBar from "../components/location/TopSearchBar";
import RouteLoadingSpinner from "../components/loading/RouteLoadingSpinner";
import SavedRouteCard from "../components/route/SavedRouteCard";
import EmptyRouteState from "../components/route/EmptyRouteState";
import {
  getSavedRoutes,
  deleteSavedRoute,
  fetchAllRoutes,
} from "../services/api/RouteService";
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
  const [allRoutes, setAllRoutes] = useState([]);

  const { reverseGeocode, updateInitialLocation, updateFinalDestination } =
    useLocation();
  const { setRouteNumber, setRelationId, setShowJeepneyRoute } = useRoute();

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  // Fetch all routes for route number lookup
  useEffect(() => {
    const getRoutes = async () => {
      try {
        const routes = await fetchAllRoutes();
        setAllRoutes(routes);
      } catch (err) {
        console.error("Error fetching all routes:", err);
      }
    };

    getRoutes();
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

            // Find the route number from allRoutes
            const matchingRoute = allRoutes.find(
              (r) => r.relationId === route.relationId
            );
            const routeNumber = matchingRoute
              ? matchingRoute.routeNumber
              : null;

            return { ...route, fromName, toName, routeNumber };
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

    if (allRoutes.length > 0) {
      fetchSavedRoutes();
    }
  }, [isAuthenticated, reverseGeocode, allRoutes]);

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

      // Fetch route details - using route number lookup instead of relation ID
      const token = localStorage.getItem("token");
      const apiBaseUrl =
        import.meta.env.VITE_API_BASE_URL ||
        "https://para-monorepo-c523fc091002.herokuapp.com";

      // First, we need to get the route number from the relation ID
      // This is a workaround since the API expects routeNumber but we only have relationId
      const allRoutesResponse = await fetch(`${apiBaseUrl}/api/routes`, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!allRoutesResponse.ok) {
        throw new Error(
          `Failed to fetch routes: ${allRoutesResponse.statusText}`
        );
      }

      const allRoutes = await allRoutesResponse.json();
      const matchingRoute = allRoutes.find(
        (r) => r.relationId === route.relationId
      );

      if (!matchingRoute) {
        throw new Error(
          `Could not find route with relation ID: ${route.relationId}`
        );
      }

      // Now we can look up the route using the route number
      const response = await fetch(
        `${apiBaseUrl}/api/routes/lookup?routeNumber=${matchingRoute.routeNumber}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
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

  const handleDeleteRoute = async (relationId) => {
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

  return (
    <div className="saved-routes-container">
      <TopSearchBar />
      <ProfileMenu />

      <div className="saved-routes-content">
        <h1 className="saved-routes-title">Saved Routes</h1>

        {loading ? (
          <div className="loading-container">
            <RouteLoadingSpinner message="Loading saved routes..." />
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
          <EmptyRouteState onSearchClick={() => navigate("/")} />
        ) : (
          <div className="saved-routes-list">
            {savedRoutes.map((route) => (
              <SavedRouteCard
                key={route.relationId}
                route={route}
                isSelected={selectedRouteId === route.relationId}
                onSelect={handleRouteClick}
                onDelete={handleDeleteRoute}
                isDeleting={deletingRouteId === route.relationId}
              />
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
