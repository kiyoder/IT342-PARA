import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "../contexts/LocationContext";
import { useRoute } from "../contexts/RouteContext";
import TopSearchBar from "../components/location/TopSearchBar";
import LoadingOverlay from "../components/loading/LoadingOverlay";
import { getSavedRoutes, deleteSavedRoute } from "../services/api/RouteService";
import "../styles/SavedRoutes.css";
import ProfileMenu from "../components/layout/ProfileMenu";

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
      { headers: { Authorization: `Bearer ${token}` } }
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
          <h2 className="saved-routes-title">Saved Routes</h2>

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
                  className={`saved-route-item ${
                    deletingRouteId === route.relationId ? "selected" : ""
                  }`}
                  onClick={() => handleRouteClick(route)}
                >
                  <div className="saved-route-info">
                    <div className="origin-location">
                      <span className="location-label">From:</span>
                      <span className="location-name">{route.fromName}</span>
                    </div>
                    <div className="destination-location">
                      <span className="location-label">To:</span>
                      <span className="location-name">{route.toName}</span>
                    </div>
                    <div className="saved-route-date">
                      {formatDate(route.createdAt)}
                    </div>
                  </div>
                  <button
                    className={`delete-route-btn ${
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
              ))}
            </div>
          )}
        </aside>

        <section className="saved-routes-map">
          {/* TODO: Map component goes here */}
        </section>
      </div>
    </div>
  );
}
