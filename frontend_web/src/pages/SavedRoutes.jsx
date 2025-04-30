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
  const [savedRoutes, setSavedRoutes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deletingRouteId, setDeletingRouteId] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const { updateInitialLocation, updateFinalDestination, selectedLocations } =
    useLocation();
  const { setRouteNumber, setRelationId, setShowJeepneyRoute } = useRoute();

  // Check if user is authenticated
  useEffect(() => {
    const token = localStorage.getItem("token");
    setIsAuthenticated(!!token);
  }, []);

  // Fetch saved routes if authenticated
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
          localStorage.removeItem("token");
          setIsAuthenticated(false);
        } else {
          setError("Failed to load saved routes. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    if (isAuthenticated) {
      fetchSavedRoutes();
    }
  }, [isAuthenticated]);

  const handleRouteClick = (route) => {
    updateInitialLocation("Starting Point", {
      latitude: route.initialLat,
      longitude: route.initialLon,
    });
    updateFinalDestination("Destination", {
      latitude: route.finalLat,
      longitude: route.finalLon,
    });

    setRelationId(route.relationId);

    const token = localStorage.getItem("token");
    fetch(
      `http://localhost:8080/api/routes/lookup?relationId=${route.relationId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    )
      .then((response) => response.json())
      .then((data) => {
        if (data.routeNumber) {
          setRouteNumber(data.routeNumber);
          setShowJeepneyRoute(true);
        }
      })
      .catch((err) => console.error("Error fetching route details:", err));

    navigate("/");
  };

  const handleDeleteRoute = async (relationId, event) => {
    event.stopPropagation();

    if (!window.confirm("Are you sure you want to delete this saved route?")) {
      return;
    }

    setDeletingRouteId(relationId);

    try {
      await deleteSavedRoute(relationId);

      // Update the local state after successful deletion
      setSavedRoutes((prevRoutes) => {
        const updated = { ...prevRoutes };
        delete updated[relationId];
        return updated;
      });
    } catch (error) {
      console.error("Error deleting route:", error);
      if (error.message.includes("Authentication required")) {
        localStorage.removeItem("token");
        setIsAuthenticated(false);
      } else {
        alert("Failed to delete route. Please try again.");
      }
    } finally {
      setDeletingRouteId(null);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="saved-routes-container">
      <TopSearchBar />
      <ProfileMenu />

      <div className="saved-routes-content">
        <h2 className="saved-routes-title">Saved Routes</h2>

        {loading ? (
          <LoadingOverlay isVisible={true} />
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
        ) : Object.keys(savedRoutes).length === 0 ? (
          <div className="no-routes-message">
            <p>You don't have any saved routes yet.</p>
            <button
              className="search-new-route-btn"
              onClick={() => navigate("/")}
            >
              Search for routes
            </button>
          </div>
        ) : (
          <div className="saved-routes-list">
            {Object.keys(savedRoutes).map((relationId) => (
              <div
                key={relationId}
                className="saved-route-item"
                onClick={() => handleRouteClick(savedRoutes[relationId])}
              >
                <div className="saved-route-info">
                  <div className="saved-route-locations">
                    <div className="origin-location">
                      <span className="location-label">From:</span>
                      <span className="location-name">
                        {selectedLocations.initial?.name ||
                          `${savedRoutes[relationId].initialLat.toFixed(
                            6
                          )}, ${savedRoutes[relationId].initialLon.toFixed(6)}`}
                      </span>
                    </div>
                    <div className="destination-location">
                      <span className="location-label">To:</span>
                      <span className="location-name">
                        {selectedLocations.final?.name ||
                          `${savedRoutes[relationId].finalLat.toFixed(
                            6
                          )}, ${savedRoutes[relationId].finalLon.toFixed(6)}`}
                      </span>
                    </div>
                  </div>
                  {savedRoutes[relationId].createdAt && (
                    <div className="saved-route-date">
                      Saved on {formatDate(savedRoutes[relationId].createdAt)}
                    </div>
                  )}
                </div>
                <button
                  className={`delete-route-btn ${
                    deletingRouteId === relationId ? "deleting" : ""
                  }`}
                  onClick={(e) => handleDeleteRoute(relationId, e)}
                  disabled={deletingRouteId === relationId}
                >
                  {deletingRouteId === relationId ? "Deleting..." : "Delete"}
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
