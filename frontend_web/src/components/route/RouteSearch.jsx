"use client";

import { useState } from "react";
import { useRoute } from "../../contexts/RouteContext";

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

  const authFetch = (url, opts = {}) => {
    const token = localStorage.getItem("JWT_TOKEN");
    return fetch(url, {
      ...opts,
      headers: {
        "Content-Type": "application/json",
        ...(opts.headers || {}),
        Authorization: token ? `Bearer ${token}` : "",
      },
    });
  };

  // Handle route search submission
  const handleRouteSearch = async (e) => {
    e.preventDefault();

    if (!searchInput.trim()) return;

    setIsLoading(true);
    setError(null);

    try {
      // Fetch relation ID directly from database using our API
      const response = await authFetch(
        `http://localhost:8080/api/routes/lookup?routeNumber=${encodeURIComponent(
          searchInput
        )}`,
        {
          method: "GET",
        }
      );

      // Get the response text first to check if it's HTML or JSON
      const responseText = await response.text();

      // Check if the response looks like HTML
      if (
        responseText.trim().toLowerCase().startsWith("<!doctype") ||
        responseText.trim().toLowerCase().startsWith("<html")
      ) {
        throw new Error(
          "Received HTML instead of JSON. The API endpoint might not exist or there might be a server error."
        );
      }

      // Try to parse the response as JSON
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (jsonError) {
        console.error("JSON parsing failed:", jsonError);
        throw new Error(
          `Invalid JSON response: ${responseText.substring(0, 50)}...`
        );
      }

      // Check if the response contains an error
      if (!response.ok) {
        throw new Error(
          data.error || `Error ${response.status}: ${response.statusText}`
        );
      }

      // Update route context with fetched data
      setRouteNumber(data.routeNumber);
      setRelationId(data.relationId);
      setShowJeepneyRoute(true);

      // Close the search panel after submission
      setIsSearchOpen(false);
    } catch (err) {
      console.error("Error during route search:", err);
      setError(
        err.message || "An error occurred while searching for the route"
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
