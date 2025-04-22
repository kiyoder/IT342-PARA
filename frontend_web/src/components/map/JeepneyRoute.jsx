"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { parseOsmRouteData } from "../../services/osm/OSMRouteParser";
import { useRoute } from "../../contexts/RouteContext";

const JeepneyRoute = ({
  map,
  mapLoaded,
  routeNumber,
  relationId,
  onRouteAdded,
}) => {
  const routeLayerRef = useRef(null);
  const sourceRef = useRef(null);

  // Get the route color directly from context to ensure it's always up-to-date
  const { getRouteColor } = useRoute();

  useEffect(() => {
    if (!map.current || !mapLoaded || !relationId) {
      console.log("JeepneyRoute: Missing required props", {
        map: !!map.current,
        mapLoaded,
        relationId,
      });
      return;
    }

    // Get the color for this route
    const routeColor = getRouteColor(routeNumber);

    console.log("JeepneyRoute: Fetching route data", {
      routeNumber,
      relationId,
      routeColor, // Log the color to verify it's being used
    });

    // Clean up previous layers and sources
    const cleanup = () => {
      if (map.current) {
        if (
          routeLayerRef.current &&
          map.current.getLayer(routeLayerRef.current)
        ) {
          map.current.removeLayer(routeLayerRef.current);
        }
        if (sourceRef.current && map.current.getSource(sourceRef.current)) {
          map.current.removeSource(sourceRef.current);
        }
      }
      routeLayerRef.current = null;
      sourceRef.current = null;
    };

    // Clean up before fetching new data
    cleanup();

    const fetchAndDisplayRoute = async () => {
      try {
        // Use the OSMRouteParser to get the route data
        const routeData = await parseOsmRouteData(relationId);

        if (
          !routeData ||
          (Array.isArray(routeData) && routeData.length === 0)
        ) {
          console.error("No route data found for relation ID:", relationId);
          return;
        }

        console.log("Route data processed:", routeData);

        // Generate unique IDs for this route
        const sourceId = `jeepney-route-${relationId}`;
        const layerId = `jeepney-route-layer-${relationId}`;

        sourceRef.current = sourceId;
        routeLayerRef.current = layerId;

        // Check if we have a single line or multiple segments
        const isMultiLineString =
          Array.isArray(routeData[0]) && Array.isArray(routeData[0][0]);

        // Create the appropriate GeoJSON structure
        let geojson;

        if (isMultiLineString) {
          // Multiple segments - create a MultiLineString
          geojson = {
            type: "Feature",
            properties: {
              routeNumber: routeNumber,
            },
            geometry: {
              type: "MultiLineString",
              coordinates: routeData,
            },
          };
          console.log(
            "Created MultiLineString GeoJSON with",
            routeData.length,
            "segments"
          );
        } else {
          // Single continuous line
          geojson = {
            type: "Feature",
            properties: {
              routeNumber: routeNumber,
            },
            geometry: {
              type: "LineString",
              coordinates: routeData,
            },
          };
          console.log(
            "Created LineString GeoJSON with",
            routeData.length,
            "coordinates"
          );
        }

        // Add the source and layer to the map
        map.current.addSource(sourceId, {
          type: "geojson",
          data: geojson,
        });

        map.current.addLayer({
          id: layerId,
          type: "line",
          source: sourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
          },
          paint: {
            // Use the routeColor from context
            "line-color": routeColor,
            "line-width": 10, // Thicker than the direct route
            "line-opacity": 0.8,
          },
        });

        // Fit the map to the route bounds
        const bounds = new mapboxgl.LngLatBounds();

        if (isMultiLineString) {
          // For MultiLineString, extend bounds with all segments
          routeData.forEach((segment) => {
            segment.forEach((coord) => {
              bounds.extend(coord);
            });
          });
        } else {
          // For LineString, extend bounds with all coordinates
          routeData.forEach((coord) => {
            bounds.extend(coord);
          });
        }

        map.current.fitBounds(bounds, {
          padding: 80,
          duration: 1000,
        });

        console.log("Route displayed successfully with color:", routeColor);

        // Call the onRouteAdded callback to ensure direct route is on top
        if (onRouteAdded) {
          // Add a small delay to ensure the layer is fully added
          setTimeout(() => {
            onRouteAdded();
          }, 100);
        }
      } catch (error) {
        console.error("Error fetching and displaying route:", error);
      }
    };

    fetchAndDisplayRoute();

    // Clean up on unmount or when route changes
    return cleanup;
  }, [map, mapLoaded, relationId, routeNumber, getRouteColor, onRouteAdded]);

  return null; // This component doesn't render anything directly
};

export default JeepneyRoute;
