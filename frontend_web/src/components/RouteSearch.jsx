"use client";

import { useState } from "react";
import { useRoute } from "./RouteContext";

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
  const [searchType, setSearchType] = useState("number"); // "number" or "id"

  // Handle route search submission
  const handleRouteSearch = (e) => {
    e.preventDefault();

    if (!searchInput.trim()) return;

    if (searchType === "number") {
      setRouteNumber(searchInput.trim().toUpperCase());
      // You might want to add a mapping of route numbers to relation IDs
      // For now, we'll keep the existing relation ID
    } else {
      setRelationId(searchInput.trim());
    }

    // Close the search panel after submission
    setIsSearchOpen(false);
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
              <div
                style={{ display: "flex", gap: "10px", marginBottom: "10px" }}
              >
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="searchType"
                    value="number"
                    checked={searchType === "number"}
                    onChange={() => setSearchType("number")}
                  />
                  Route Number
                </label>
                <label
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    cursor: "pointer",
                  }}
                >
                  <input
                    type="radio"
                    name="searchType"
                    value="id"
                    checked={searchType === "id"}
                    onChange={() => setSearchType("id")}
                  />
                  Relation ID
                </label>
              </div>
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={
                  searchType === "number"
                    ? "Enter route number (e.g. 12D)"
                    : "Enter relation ID (e.g. 3203006)"
                }
                style={{
                  width: "100%",
                  padding: "8px 12px",
                  borderRadius: "4px",
                  border: "1px solid #ccc",
                  fontSize: "14px",
                }}
              />
            </div>
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
                }}
              >
                Search
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
