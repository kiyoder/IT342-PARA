import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useLocation } from "../contexts/LocationContext"; // Import the context
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

  const { updateInitialLocation, updateFinalDestination, selectedLocations } =
    useLocation(); // Access the context

  const { setRouteNumber, setRelationId, setShowJeepneyRoute } = useRoute();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch saved routes from API
    const fetchSavedRoutes = async () => {
      try {
        setLoading(true);
        setError(null);

        const routes = await getSavedRoutes();
        setSavedRoutes(routes);
      } catch (error) {
        console.error("Error fetching saved routes:", error);
        if (error.message.includes("Authentication required")) {
          localStorage.removeItem("token");
          navigate("/login");
        } else {
          setError("Failed to load saved routes. Please try again.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchSavedRoutes();
  }, [navigate]);

  const handleRouteClick = (route) => {
    // Set origin and destination in context
    updateInitialLocation("Starting Point", {
      latitude: route.initialLat,
      longitude: route.initialLon,
    });

    updateFinalDestination("Destination", {
      latitude: route.finalLat,
      longitude: route.finalLon,
    });

    // Set route information
    setRelationId(route.relationId);

    // Fetch route details to get the route number
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

    // Navigate to home page
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
      setSavedRoutes((prevRoutes) =>
        prevRoutes.filter((route) => route.relationId !== relationId)
      );
    } catch (error) {
      console.error("Error deleting route:", error);
      if (error.message.includes("Authentication required")) {
        localStorage.removeItem("token");
        navigate("/login");
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
        ) : savedRoutes.length === 0 ? (
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
            {savedRoutes.map((route) => (
              <div
                key={route.id}
                className="saved-route-item"
                onClick={() => handleRouteClick(route)}
              >
                <div className="saved-route-info">
                  <div className="saved-route-locations">
                    <div className="origin-location">
                      <span className="location-label">From:</span>
                      <span className="location-name">
                        {selectedLocations.initial?.name ||
                          `${route.initialLat.toFixed(
                            6
                          )}, ${route.initialLon.toFixed(6)}`}
                      </span>
                    </div>
                    <div className="destination-location">
                      <span className="location-label">To:</span>
                      <span className="location-name">
                        {selectedLocations.final?.name ||
                          `${route.finalLat.toFixed(
                            6
                          )}, ${route.finalLon.toFixed(6)}`}
                      </span>
                    </div>
                  </div>
                  <div className="saved-route-relation">
                    <span className="relation-label">Route ID:</span>
                    <span className="relation-id">{route.relationId}</span>
                  </div>
                  {route.createdAt && (
                    <div className="saved-route-date">
                      Saved on {formatDate(route.createdAt)}
                    </div>
                  )}
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
      </div>
    </div>
  );
}
