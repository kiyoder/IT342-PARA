"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";

/**
 * Component to render OSM route data on a Mapbox map
 * @param {Object} props - Component props
 * @param {Object} props.map - Mapbox map instance reference
 * @param {boolean} props.mapLoaded - Whether the map is loaded
 * @param {string} props.routeId - Optional ID to identify this route (defaults to "osm-route")
 * @param {string} props.routeColor - Color for the route line (defaults to "#3388ff")
 * @param {number} props.routeWidth - Width for the route line (defaults to 5)
 * @param {number} props.routeOpacity - Opacity for the route line (defaults to 0.8)
 * @param {boolean} props.fitToRoute - Whether to fit the map to show the entire route (defaults to true)
 */
const RouteRenderer = ({
  map,
  mapLoaded,
  routeId = "osm-route",
  routeColor = "#3388ff",
  routeWidth = 5,
  routeOpacity = 0.8,
  fitToRoute = true,
}) => {
  const coordinatesRef = useRef([]);

  // OSM route data parser function
  const parseOsmRoute = () => {
    // This is a simplified version that extracts coordinates from the Jeepney 13C route
    // In a real implementation, you would fetch this data from an API or parse a more structured format

    // Sample coordinates extracted from the Jeepney 13C route
    // These are approximate points along the route based on the streets mentioned
    return [
      // P. del Rosario Street
      [123.8939, 10.2988],
      [123.8935, 10.2978],

      // Governor M. Cuenco Avenue and M. Cuenco Avenue sections
      [123.9023, 10.3158],
      [123.9033, 10.321],
      [123.9067, 10.3305],
      [123.91, 10.34],
      [123.9133, 10.349],

      // Continuing through Sikatuna Street
      [123.9155, 10.356],

      // Imus Avenue and M.J. Cuenco Avenue
      [123.9121, 10.3611],
      [123.9085, 10.3652],

      // Gorordo Avenue section
      [123.9042, 10.34],

      // Colon Street section
      [123.8977, 10.3],

      // Back to P. del Rosario area
      [123.895, 10.299],

      // Archbishop Reyes Avenue to complete the loop
      [123.904, 10.318],
    ];
  };

  // Render the route on the map
  useEffect(() => {
    if (!map || !mapLoaded) return;

    const mapInstance = map.current;
    if (!mapInstance) return;

    // Parse OSM route data to get coordinates
    const coordinates = parseOsmRoute();
    coordinatesRef.current = coordinates;

    // Check if route source already exists
    if (mapInstance.getSource(routeId)) {
      // Update existing source
      mapInstance.getSource(routeId).setData({
        type: "Feature",
        properties: {},
        geometry: {
          type: "LineString",
          coordinates: coordinates,
        },
      });
    } else {
      // Add new source and layer for the route
      mapInstance.addSource(routeId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
        },
      });

      // Add the route line layer
      mapInstance.addLayer({
        id: routeId,
        type: "line",
        source: routeId,
        layout: {
          "line-join": "round",
          "line-cap": "round",
        },
        paint: {
          "line-color": routeColor,
          "line-width": routeWidth,
          "line-opacity": routeOpacity,
        },
      });

      // Optionally add markers at the start and end points
      // This is commented out for simplicity but you can uncomment if needed
      /*
      // Start marker
      const startMarker = document.createElement("div");
      startMarker.className = "route-marker route-start-marker";
      new mapboxgl.Marker(startMarker)
        .setLngLat(coordinates[0])
        .addTo(mapInstance);

      // End marker
      const endMarker = document.createElement("div");
      endMarker.className = "route-marker route-end-marker";
      new mapboxgl.Marker(endMarker)
        .setLngLat(coordinates[coordinates.length - 1])
        .addTo(mapInstance);
      */
    }

    // Fit map to show the entire route if specified
    if (fitToRoute) {
      const bounds = new mapboxgl.LngLatBounds();

      // Extend bounds with all coordinates in the route
      coordinates.forEach((coord) => {
        bounds.extend(coord);
      });

      mapInstance.fitBounds(bounds, {
        padding: 80,
        duration: 1000,
      });
    }

    // Cleanup function
    return () => {
      if (mapInstance && mapInstance.getLayer(routeId)) {
        mapInstance.removeLayer(routeId);
        mapInstance.removeSource(routeId);
      }
    };
  }, [
    map,
    mapLoaded,
    routeId,
    routeColor,
    routeWidth,
    routeOpacity,
    fitToRoute,
  ]);

  // This component doesn't render anything, it just adds the route to the map
  return null;
};

export default RouteRenderer;
