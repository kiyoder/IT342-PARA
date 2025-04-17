"use client";

import { useState, useEffect } from "react";
import "../../styles/TopSearchBar.css";
import { Search } from "lucide-react";
import { useLocation } from "../../contexts/LocationContext";
import SearchResults from "./SearchResults";
import ConfirmationModal from "./ConfirmationModal";

const TopSearchBar = () => {
  const {
    searchQuery,
    setSearchQuery,
    updateInitialLocation,
    updateFinalDestination,
    setSelectedLocation,
    setPinnedLocation,
    pinnedLocation,
    finalDestination,
    initialFocused,
    finalFocused,
  } = useLocation();

  const [showConfirmation, setShowConfirmation] = useState(false);
  const [tempLocation, setTempLocation] = useState(null);
  // Add state to track whether we're searching for initial or final location
  const [searchMode, setSearchMode] = useState("final"); // "final" or "initial"

  // Update search mode when input focus changes
  useEffect(() => {
    if (initialFocused) {
      setSearchMode("initial");
    } else if (finalFocused) {
      setSearchMode("final");
    }
    // Keep the existing logic for when neither is focused
    else if (finalDestination && pinnedLocation) {
      setSearchMode("initial");
    }
  }, [initialFocused, finalFocused, finalDestination, pinnedLocation]);

  // Handle location selection from search results
  const handleLocationSelected = (location) => {
    setTempLocation(location);
    setShowConfirmation(true);
  };

  // Handle confirmation modal responses
  const handleConfirm = () => {
    if (tempLocation) {
      // Check if the location has explicit isInitial/isFinal flags
      if (tempLocation.isInitial) {
        // Update initial location
        updateInitialLocation(tempLocation.name, {
          latitude: tempLocation.latitude,
          longitude: tempLocation.longitude,
        });

        // Update the selected location on the map
        setSelectedLocation({
          latitude: tempLocation.latitude,
          longitude: tempLocation.longitude,
          name: tempLocation.name,
        });
      } else if (tempLocation.isFinal) {
        // Update final destination
        updateFinalDestination(tempLocation.name, {
          latitude: tempLocation.latitude,
          longitude: tempLocation.longitude,
        });

        // Update the pinned location on the map
        setPinnedLocation({
          latitude: tempLocation.latitude,
          longitude: tempLocation.longitude,
          name: tempLocation.name,
        });
      } else {
        // Fall back to searchMode if no explicit flags
        if (searchMode === "final") {
          // Update final destination
          updateFinalDestination(tempLocation.name, {
            latitude: tempLocation.latitude,
            longitude: tempLocation.longitude,
          });

          // Update the pinned location on the map
          setPinnedLocation({
            latitude: tempLocation.latitude,
            longitude: tempLocation.longitude,
            name: tempLocation.name,
          });

          // Switch to initial location mode after confirming final destination
          setSearchMode("initial");
        } else {
          // Update initial location
          updateInitialLocation(tempLocation.name, {
            latitude: tempLocation.latitude,
            longitude: tempLocation.longitude,
          });

          // Update the selected location on the map
          setSelectedLocation({
            latitude: tempLocation.latitude,
            longitude: tempLocation.longitude,
            name: tempLocation.name,
          });
        }
      }
    }

    // Close modal and clear search
    setShowConfirmation(false);
    setSearchQuery("");
    setTempLocation(null);
  };

  const handleCancel = () => {
    // Clear everything
    setShowConfirmation(false);
    setSearchQuery("");
    setTempLocation(null);
    setSelectedLocation(null);
  };

  // Get placeholder text based on search mode
  const getPlaceholderText = () => {
    return searchMode === "final"
      ? "Search Final Destination"
      : "Search Initial Location";
  };

  // Get confirmation title based on search mode
  const getConfirmationTitle = () => {
    return searchMode === "final"
      ? "Confirm Final Destination"
      : "Confirm Initial Location";
  };

  return (
    <>
      <div className="top-search-bar">
        <div className="search-container">
          <Search className="search-icon" />
          <input
            type="text"
            placeholder={getPlaceholderText()}
            className="search-input"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button className="search-button">&gt;</button>

          {/* Pass the handler to SearchResults */}
          <SearchResults onLocationSelected={handleLocationSelected} />
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirmation && (
        <ConfirmationModal
          location={tempLocation}
          onConfirm={handleConfirm}
          onCancel={handleCancel}
          title={getConfirmationTitle()}
        />
      )}
    </>
  );
};

export default TopSearchBar;
