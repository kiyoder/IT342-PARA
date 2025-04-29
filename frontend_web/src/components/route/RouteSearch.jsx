"use client";

import { useState } from "react";
import { useRoute } from "../../contexts/RouteContext";
import { axios } from "axios";

const RouteSearch = () => {
  const {
    showJeepneyRoute,
    setShowJeepneyRoute,
    routeNumber,
    setRouteNumber,
    setRelationId,
  } = useRoute();

  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  // Handle route search submission
  const handleRouteSearch = async (e) => {
    e.preventDefault();

    if (!searchInput.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      const { data } = await axios.get(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/routes/lookup?routeNumber=${encodeURIComponent(
          searchInput.trim()
        )}`,
        {
          withCredentials: true, // for cookie-based auth if needed
        }
      );

      setRouteNumber(data.routeNumber);
      setRelationId(data.relationId);
      setShowJeepneyRoute(true);
      setIsSearchOpen(false);
    } catch (err) {
      console.error("Error during route search:", err);

      setError(
        err.response?.data?.error ||
          err.message ||
          "An error occurred while searching for the route"
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="route-controls"
      style={{
        position: "absolute",
        bottom: "20px",
        right: "20px",
        zIndex: 10,
        display: "flex",
        flexDirection: "column",
        gap: "10px",
        alignItems: "flex-end",
      }}
    >
      {/* Search panel - only shown when isSearchOpen is true */}
      {isSearchOpen && (
        <div
          className="route-search-panel"
          style={{
            backgroundColor: "white",
            padding: "15px",
            borderRadius: "8px",
            boxShadow: "0 2px 10px rgba(0,0,0,0.2)",
            width: "250px",
          }}
        >
          <form onSubmit={handleRouteSearch}>
            <div style={{ marginBottom: "10px" }}>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Enter route number (e.g. 12D)"
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                }}
              />
            </div>
            {error && (
              <div
                style={{
                  color: "red",
                  fontSize: "12px",
                  marginBottom: "10px",
                }}
              >
                {error}
              </div>
            )}
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: "#f0f0f0",
                  cursor: "pointer",
                }}
                disabled={isLoading}
              >
                Cancel
              </button>
              <button
                type="submit"
                style={{
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "none",
                  backgroundColor: "#FF7F00",
                  color: "white",
                  fontWeight: "bold",
                  cursor: "pointer",
                  opacity: isLoading ? 0.7 : 1,
                }}
                disabled={isLoading}
              >
                {isLoading ? "Searching..." : "Search"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Route toggle and search buttons */}
      <div style={{ display: "flex", gap: "10px" }}>
        <button
          className="map-control-button"
          style={{
            backgroundColor: "#FF7F00",
            color: "white",
            padding: "8px 12px",
            borderRadius: "4px",
            boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
            cursor: "pointer",
            fontWeight: "bold",
            border: "none",
          }}
          onClick={() => setIsSearchOpen(true)}
        >
          Search Routes
        </button>

        {routeNumber && (
          <button
            className="map-control-button"
            style={{
              backgroundColor: showJeepneyRoute ? "#FF7F00" : "white",
              color: showJeepneyRoute ? "white" : "#333",
              padding: "8px 12px",
              borderRadius: "4px",
              boxShadow: "0 2px 4px rgba(0,0,0,0.2)",
              cursor: "pointer",
              fontWeight: "bold",
              border: "none",
            }}
            onClick={() => setShowJeepneyRoute((prev) => !prev)}
          >
            {showJeepneyRoute ? `Hide` : `Show`} {routeNumber}
          </button>
        )}
      </div>
    </div>
  );
};

export default RouteSearch;
