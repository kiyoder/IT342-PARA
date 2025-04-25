"use client";

import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import { parseOsmRouteData } from "../../services/osm/OSMRouteParser";
import { useRoute } from "../../contexts/RouteContext";
import { useLocation } from "../../contexts/LocationContext";
import { calculateDistance } from "../../services/api/RouteService";

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
  const { selectedLocations } = useLocation();

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

        // Extract only the portion of the route that the user will travel on
        let relevantRouteData;

        if (selectedLocations.initial.lat && selectedLocations.final.lat) {
          relevantRouteData = extractRelevantRoutePortion(
            routeData,
            isMultiLineString,
            selectedLocations.initial.lat,
            selectedLocations.initial.lon,
            selectedLocations.final.lat,
            selectedLocations.final.lon
          );
        } else {
          // If we don't have both locations, use the full route
          relevantRouteData = routeData;
        }

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
              coordinates: relevantRouteData,
            },
          };
          console.log(
            "Created MultiLineString GeoJSON with",
            relevantRouteData.length,
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
              coordinates: relevantRouteData,
            },
          };
          console.log(
            "Created LineString GeoJSON with",
            relevantRouteData.length,
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
          relevantRouteData.forEach((segment) => {
            segment.forEach((coord) => {
              bounds.extend(coord);
            });
          });
        } else {
          // For LineString, extend bounds with all coordinates
          relevantRouteData.forEach((coord) => {
            bounds.extend(coord);
          });
        }

        // Also include the initial and final locations in the bounds
        if (selectedLocations.initial.lat && selectedLocations.initial.lon) {
          bounds.extend([
            selectedLocations.initial.lon,
            selectedLocations.initial.lat,
          ]);
        }
        if (selectedLocations.final.lat && selectedLocations.final.lon) {
          bounds.extend([
            selectedLocations.final.lon,
            selectedLocations.final.lat,
          ]);
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
  }, [
    map,
    mapLoaded,
    relationId,
    routeNumber,
    getRouteColor,
    onRouteAdded,
    selectedLocations,
  ]);

  return null; // This component doesn't render anything directly
};

// Helper function to extract only the portion of the route that the user will travel on
function extractRelevantRoutePortion(
  routeData,
  isMultiLineString,
  initialLat,
  initialLon,
  finalLat,
  finalLon
) {
  // If it's a MultiLineString, we need to flatten it first to find the closest points
  let flattenedRoute = [];
  const segmentIndices = []; // Keep track of which segment each point belongs to

  if (isMultiLineString) {
    routeData.forEach((segment, segmentIndex) => {
      segment.forEach((point) => {
        flattenedRoute.push(point);
        segmentIndices.push(segmentIndex);
      });
    });
  } else {
    flattenedRoute = routeData;
  }

  // Find the closest points on the route to the initial and final locations
  let closestInitialIndex = -1;
  let closestFinalIndex = -1;
  let minInitialDistance = Number.POSITIVE_INFINITY;
  let minFinalDistance = Number.POSITIVE_INFINITY;

  for (let i = 0; i < flattenedRoute.length; i++) {
    const point = flattenedRoute[i];
    // Note: route coordinates are [lon, lat] in GeoJSON
    const pointLon = point[0];
    const pointLat = point[1];

    // Calculate distance to initial location
    const initialDistance = calculateDistance(
      initialLat,
      initialLon,
      pointLat,
      pointLon
    );
    if (initialDistance < minInitialDistance) {
      minInitialDistance = initialDistance;
      closestInitialIndex = i;
    }

    // Calculate distance to final location
    const finalDistance = calculateDistance(
      finalLat,
      finalLon,
      pointLat,
      pointLon
    );
    if (finalDistance < minFinalDistance) {
      minFinalDistance = finalDistance;
      closestFinalIndex = i;
    }
  }

  // Ensure we're going in the right direction
  const startIndex = Math.min(closestInitialIndex, closestFinalIndex);
  const endIndex = Math.max(closestInitialIndex, closestFinalIndex);

  // Extract the relevant portion of the route
  if (isMultiLineString) {
    // For MultiLineString, we need to reconstruct the segments
    const relevantSegments = [];
    let currentSegment = [];
    let currentSegmentIndex = -1;

    for (let i = startIndex; i <= endIndex; i++) {
      const segmentIndex = segmentIndices[i];

      // If we're starting a new segment
      if (segmentIndex !== currentSegmentIndex) {
        if (currentSegment.length > 0) {
          relevantSegments.push(currentSegment);
        }
        currentSegment = [];
        currentSegmentIndex = segmentIndex;
      }

      currentSegment.push(flattenedRoute[i]);
    }

    // Add the last segment
    if (currentSegment.length > 0) {
      relevantSegments.push(currentSegment);
    }

    return relevantSegments;
  } else {
    // For LineString, just slice the array
    return flattenedRoute.slice(startIndex, endIndex + 1);
  }
}

export default JeepneyRoute;
