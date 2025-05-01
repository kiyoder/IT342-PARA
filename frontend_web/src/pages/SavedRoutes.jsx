"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "../contexts/LocationContext";
import { useRoute } from "../contexts/RouteContext";
import TopSearchBar from "../components/location/TopSearchBar";
import LoadingOverlay from "../components/loading/LoadingOverlay";
import { getSavedRoutes, deleteSavedRoute } from "../services/api/RouteService";
import "../styles/SavedRoutes.css";
import ProfileMenu from "../components/layout/ProfileMenu";
import {
  MapPin,
  Navigation,
  Calendar,
  Trash2,
  AlertCircle,
  Search,
  RefreshCw,
} from "lucide-react";

export default function SavedRoutes() {
  const navigate = useNavigate();
  const [savedRoutes, setSavedRoutes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingRouteId, setDeletingRouteId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { reverseGeocode } = useLocation();
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

  const handleRouteClick = (route) => {
    setRelationId(route.relationId);
    const token = localStorage.getItem("token");
    fetch(
      `http://localhost:8080/api/routes/lookup?relationId=${route.relationId}`,
      {
        headers: { Authorization: `Bearer ${token}` },
      }
    )
      .then((res) => res.json())
      .then((data) => {
        if (data.routeNumber) {
          setRouteNumber(data.routeNumber);
          setShowJeepneyRoute(true);
        }
      });
    navigate("/");
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

      <div className="saved-routes-layout">
        <aside className="saved-routes-sidebar">
          <div className="saved-routes-header">
            <h2 className="saved-routes-title">Saved Routes</h2>
          </div>

          {loading ? (
            <div className="loading-container">
              <LoadingOverlay isVisible />
            </div>
          ) : error ? (
            <div className="error-message">
              <AlertCircle className="error-icon" />
              <p>{error}</p>
              <button
                className="retry-btn"
                onClick={() => window.location.reload()}
              >
                <RefreshCw className="btn-icon" />
                Retry
              </button>
            </div>
          ) : savedRoutes.length === 0 ? (
            <div className="no-routes-message">
              <div className="empty-state-icon">
                <MapPin size={48} />
              </div>
              <p>No saved routes yet</p>
              <button
                className="search-new-route-btn"
                onClick={() => navigate("/")}
              >
                <Search className="btn-icon" />
                Search routes
              </button>
            </div>
          ) : (
            <div className="saved-routes-list">
              {savedRoutes.map((route) => (
                <div
                  key={route.relationId}
                  className={`saved-route-item ${
                    deletingRouteId === route.relationId ? "deleting" : ""
                  }`}
                  onClick={() => handleRouteClick(route)}
                >
                  <div className="saved-route-info">
                    <div className="route-locations">
                      <div className="origin-location">
                        <MapPin
                          className="location-icon origin-icon"
                          size={16}
                        />
                        <div>
                          <span className="location-label">From</span>
                          <span className="location-name">
                            {route.fromName}
                          </span>
                        </div>
                      </div>
                      <div className="route-connector"></div>
                      <div className="destination-location">
                        <Navigation
                          className="location-icon destination-icon"
                          size={16}
                        />
                        <div>
                          <span className="location-label">To</span>
                          <span className="location-name">{route.toName}</span>
                        </div>
                      </div>
                    </div>
                    <div className="saved-route-date">
                      <Calendar className="date-icon" size={14} />
                      {formatDate(route.createdAt)}
                    </div>
                  </div>
                  <button
                    className={`delete-route-btn ${
                      deletingRouteId === route.relationId ? "deleting" : ""
                    }`}
                    onClick={(e) => handleDeleteRoute(route.relationId, e)}
                    disabled={deletingRouteId === route.relationId}
                    aria-label="Delete route"
                  >
                    <Trash2 size={16} />
                    <span className="delete-text">
                      {deletingRouteId === route.relationId
                        ? "Deleting..."
                        : "Delete"}
                    </span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </aside>

        <section className="saved-routes-map">
          <div className="map-placeholder">
            <div className="map-message">
              <MapPin size={32} />
              <p>Select a route to view on map</p>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
