"use client";

import { useEffect, useRef, useState } from "react";
import { useLocation } from "../../contexts/LocationContext";
import mapboxgl from "mapbox-gl";

const UserLocationMarker = ({ map }) => {
  const markerRef = useRef(null);
  const { userPosition, userHeading } = useLocation();
  const [isInitialized, setIsInitialized] = useState(false);

  // Create a custom HTML marker element with heading indicator
  const createUserMarkerElement = () => {
    const el = document.createElement("div");
    el.className = "user-marker-wrapper";

    // Create the main dot
    const userDot = document.createElement("div");
    userDot.className = "user-location-dot";

    // Create the heading indicator
    const headingIndicator = document.createElement("div");
    headingIndicator.className = "user-heading-indicator";

    el.appendChild(userDot);
    el.appendChild(headingIndicator);
    return el;
  };

  // Initialize and update the user marker
  useEffect(() => {
    if (!map.current || !userPosition) return;

    // If marker doesn't exist yet, create it
    if (!markerRef.current) {
      const el = createUserMarkerElement();
      markerRef.current = new mapboxgl.Marker({
        element: el,
        rotationAlignment: "map",
      })
        .setLngLat([userPosition.longitude, userPosition.latitude])
        .addTo(map.current);

      setIsInitialized(true);
    } else {
      // Just update the marker position without recreating it
      markerRef.current.setLngLat([
        userPosition.longitude,
        userPosition.latitude,
      ]);
    }

    // Update the heading indicator rotation if available
    if (
      markerRef.current &&
      userHeading !== null &&
      userHeading !== undefined
    ) {
      const markerElement = markerRef.current.getElement();
      const headingIndicator = markerElement.querySelector(
        ".user-heading-indicator"
      );
      if (headingIndicator) {
        headingIndicator.style.transform = `rotate(${userHeading}deg)`;
      }
    }
  }, [map, userPosition, userHeading]);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (markerRef.current) {
        markerRef.current.remove();
      }
    };
  }, []);

  // This component doesn't render anything directly
  return null;
};

export default UserLocationMarker;
