"use client";

import { useEffect, useState } from "react";
import { parseOsmRouteData } from "../../services/osm/OSMRouteParser";
import mapboxgl from "mapbox-gl";

/**
 * Component to display Jeepney routes on the map using dynamic data from OSM.
 * @param {Object} props - Component props
 * @param {Object} props.map - Mapbox map instance reference
 * @param {boolean} props.mapLoaded - Whether the map is loaded
 * @param {string} props.relationId - The OSM relation ID for the route
 * @param {string} props.routeNumber - Jeepney route number
 * @param {string} props.routeColor - Color for the route line (default "#FF7F00")
 */
const JeepneyRoute = ({
  map,
  mapLoaded,
  relationId,
  routeNumber,
  routeColor = "#FF7F00",
}) => {
  const [routeId, setRouteId] = useState(`jeepney-${routeNumber}`);
  const [geometryData, setGeometryData] = useState(null); // Will hold either a LineString or MultiLineString
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Update routeId when routeNumber changes
  useEffect(() => {
    setRouteId(`jeepney-${routeNumber}`);
  }, [routeNumber]);

  // Fetch dynamic route data using the relationId.
  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Clear previous route if it exists
        if (map && map.current && map.current.getLayer(routeId)) {
          if (map.current.getLayer(`${routeId}-label`)) {
            map.current.removeLayer(`${routeId}-label`);
          }
          map.current.removeLayer(routeId);
          map.current.removeSource(routeId);
        }

        const parsedCoordinates = await parseOsmRouteData(relationId);
        // Determine if parsedCoordinates is nested (MultiLineString) or flat (LineString).
        const geom =
          parsedCoordinates.length > 0 &&
          Array.isArray(parsedCoordinates[0]) &&
          Array.isArray(parsedCoordinates[0][0])
            ? { type: "MultiLineString", coordinates: parsedCoordinates }
            : { type: "LineString", coordinates: parsedCoordinates };
        setGeometryData(geom);
        setLoading(false);
      } catch (err) {
        console.error("Error fetching route data:", err);
        setError(err.message);
        setLoading(false);
      }
    };

    if (mapLoaded && relationId) {
      fetchRouteData();
    }
  }, [relationId, routeNumber, routeId, map, mapLoaded]);

  // Render the route on the map once data is available.
  useEffect(() => {
    if (!map || !mapLoaded || !geometryData) return;

    const mapInstance = map.current;
    if (!mapInstance) return;

    console.log(
      `Rendering route ${routeNumber} (ID: ${relationId}) with geometry:`,
      geometryData
    );

    if (mapInstance.getSource(routeId)) {
      mapInstance.getSource(routeId).setData({
        type: "Feature",
        properties: {
          routeNumber: routeNumber,
        },
        geometry: geometryData,
      });
    } else {
      mapInstance.addSource(routeId, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {
            routeNumber: routeNumber,
          },
          geometry: geometryData,
        },
      });

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
          "line-width": 6,
          "line-opacity": 0.8,
        },
      });

      // Add route number labels
      mapInstance.addLayer({
        id: `${routeId}-label`,
        type: "symbol",
        source: routeId,
        layout: {
          "symbol-placement": "line",
          "text-field": routeNumber,
          "text-size": 12,
          "text-allow-overlap": false,
          "symbol-spacing": 500,
          "text-offset": [0, -1],
        },
        paint: {
          "text-color": "#ffffff",
          "text-halo-color": routeColor,
          "text-halo-width": 2,
        },
      });
    }

    // Fit map bounds to the route.
    const bounds = new mapboxgl.LngLatBounds();
    if (geometryData.type === "LineString") {
      geometryData.coordinates.forEach((coord) => bounds.extend(coord));
    } else if (geometryData.type === "MultiLineString") {
      geometryData.coordinates.forEach((segment) =>
        segment.forEach((coord) => bounds.extend(coord))
      );
    }

    if (!bounds.isEmpty()) {
      mapInstance.fitBounds(bounds, { padding: 80, duration: 1000 });
    }

    return () => {
      if (mapInstance && mapInstance.getLayer(routeId)) {
        if (mapInstance.getLayer(`${routeId}-label`)) {
          mapInstance.removeLayer(`${routeId}-label`);
        }
        mapInstance.removeLayer(routeId);
        mapInstance.removeSource(routeId);
      }
    };
  }, [
    map,
    mapLoaded,
    geometryData,
    routeId,
    routeNumber,
    routeColor,
    relationId,
  ]);

  if (loading) {
    console.log(
      `Loading OSM route data for ${routeNumber} (ID: ${relationId})...`
    );
  }
  if (error) {
    console.error(
      `Error loading route ${routeNumber} (ID: ${relationId}):`,
      error
    );
  }

  return null;
};

export default JeepneyRoute;
