// Service to handle route-related API calls and calculations

// Base URL for API calls
const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

//token
const authFetch = (url, opts = {}) => {
  const token = localStorage.getItem("JWT_TOKEN");
  return fetch(url, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...(opts.headers || {}),
      Authorization: token ? `Bearer ${token}` : undefined,
    },
  });
};

// Get all saved routes for the current user
export const getSavedRoutes = async () => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_BASE_URL}/saved-routes`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.status === 401) {
      throw new Error("Authentication required");
    }

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error fetching saved routes:", error);
    throw error;
  }
};

// Save a route for the current user
export const saveRoute = async (routeData) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(`${API_BASE_URL}/saved-routes`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(routeData),
    });

    if (response.status === 401) {
      throw new Error("Authentication required");
    }

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error saving route:", error);
    throw error;
  }
};

// Delete a saved route
export const deleteSavedRoute = async (relationId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      throw new Error("Authentication required");
    }

    const response = await fetch(
      `${API_BASE_URL}/saved-routes?relationId=${relationId}`,
      {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status === 401) {
      throw new Error("Authentication required");
    }

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting saved route:", error);
    throw error;
  }
};

// Check if a route is saved
export const isRouteSaved = async (relationId) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) {
      return false; // Not authenticated, so not saved
    }

    const response = await fetch(
      `${API_BASE_URL}/saved-routes/check?relationId=${relationId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!response.ok) {
      return false;
    }

    const data = await response.json();
    return data.isSaved;
  } catch (error) {
    console.error("Error checking if route is saved:", error);
    return false;
  }
};

// Fetch all available routes from the backend
export const fetchAllRoutes = async () => {
  try {
    const routes = await authFetch(`${API_BASE_URL}/routes/all`, {
      method: "GET",
    });
    if (!routes.ok) {
      throw new Error(`Error ${routes.status}: ${routes.statusText}`);
    }
    return await routes.json();
  } catch (error) {
    console.error("Error fetching routes:", error);
    return [];
  }
};

// Calculate distance between two points in meters using the Haversine formula
export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c; // Distance in meters
};

// Check if a route passes near a point (within maxDistance meters)
export const routePassesNearPoint = async (
  relationId,
  lat,
  lon,
  maxDistance = 100,
  signal
) => {
  try {
    // Fetch route data from OSM
    const query = `
      [out:json][timeout:25];
      relation(${relationId});
      >>;
      out geom;
    `;

    const response = await fetch("https://overpass-api.de/api/interpreter", {
      method: "POST",
      body: query,
      signal: signal, // Pass the abort signal
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    // Extract all coordinates from the route
    const coordinates = [];
    data.elements.forEach((element) => {
      if (element.type === "way" && element.geometry) {
        element.geometry.forEach((point) => {
          coordinates.push([point.lat, point.lon]);
        });
      }
    });

    // Check if any point in the route is within maxDistance of the given point
    for (const [pointLat, pointLon] of coordinates) {
      const distance = calculateDistance(lat, lon, pointLat, pointLon);
      if (distance <= maxDistance) {
        return true;
      }
    }

    return false;
  } catch (error) {
    if (error.name === "AbortError") {
      console.log(`Search for route ${relationId} was cancelled`);
      throw error;
    }
    console.error(
      `Error checking if route ${relationId} passes near point:`,
      error
    );
    return false;
  }
};

// Find routes that pass near both initial and final locations
export const findNearbyRoutes = async (
  initialLat,
  initialLon,
  finalLat,
  finalLon,
  maxDistance = 100,
  onProgress = null,
  signal = null
) => {
  try {
    // Fetch all available routes
    const allRoutes = await fetchAllRoutes();
    const totalRoutes = allRoutes.length;

    console.log("Scanning routes for your journey...");
    console.log(`Initial location: ${initialLat}, ${initialLon}`);
    console.log(`Final destination: ${finalLat}, ${finalLon}`);
    console.log(
      "Searching for routes within",
      maxDistance,
      "meters of your points..."
    );

    const matchingRoutes = [];
    // Calculate direct distance between initial and final points
    const straightLineDistance = calculateDistance(
      initialLat,
      initialLon,
      finalLat,
      finalLon
    );
    console.log(
      `Direct distance between points: ${straightLineDistance} meters`
    );

    // Check each route
    for (let i = 0; i < allRoutes.length; i++) {
      // Check if the search was cancelled
      if (signal && signal.aborted) {
        throw new DOMException("Search cancelled by user", "AbortError");
      }

      const route = allRoutes[i];
      console.log(
        `Checking route ${route.routeNumber} (ID: ${route.relationId})...`
      );

      // Update progress incrementally (use i+1 so we never stay at 0)
      if (onProgress) {
        onProgress(Math.round(((i + 1) / totalRoutes) * 100));
      }

      // Add a small delay to make the progress visible
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Check if route passes near both points
      const passesNearInitial = await routePassesNearPoint(
        route.relationId,
        initialLat,
        initialLon,
        maxDistance,
        signal
      );

      if (passesNearInitial) {
        const passesNearFinal = await routePassesNearPoint(
          route.relationId,
          finalLat,
          finalLon,
          maxDistance,
          signal
        );

        if (passesNearFinal) {
          // Calculate the travel distance along the route
          const travelDistance = await calculateRouteDistance(
            route.relationId,
            initialLat,
            initialLon,
            finalLat,
            finalLon,
            straightLineDistance,
            signal
          );

          matchingRoutes.push({
            routeNumber: route.routeNumber,
            relationId: route.relationId,
            locations: route.locations,
            distance: travelDistance, // Add the calculated travel distance
          });
        }
      }
    }

    // Set progress to 100% when done
    if (onProgress && !signal?.aborted) {
      onProgress(100);
    }

    return matchingRoutes;
  } catch (error) {
    if (error.name === "AbortError") {
      console.log("Route search was cancelled");
      throw error;
    }
    console.error("Error finding nearby routes:", error);
    // Set progress to 100% even on error to close the loading screen
    if (onProgress && !signal?.aborted) {
      onProgress(100);
    }
    return [];
  }
};

// Cache for route coordinates to avoid redundant fetching
const routeCoordinatesCache = new Map();

// Calculate the travel distance along a route between two points
export const calculateRouteDistance = async (
  relationId,
  initialLat,
  initialLon,
  finalLat,
  finalLon,
  straightLineDistance = null,
  signal = null
) => {
  try {
    // Check if we already have the route coordinates in cache
    let routeCoordinates = routeCoordinatesCache.get(relationId);

    if (!routeCoordinates) {
      // Fetch route data from OSM
      const query = `
        [out:json][timeout:25];
        relation(${relationId});
        >>;
        out geom;
      `;

      const response = await fetch("https://overpass-api.de/api/interpreter", {
        method: "POST",
        body: query,
        signal: signal,
      });

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();

      // Get the relation details to understand the route structure
      let relation = null;
      data.elements.forEach((element) => {
        if (
          element.type === "relation" &&
          element.id.toString() === relationId.toString()
        ) {
          relation = element;
        }
      });

      if (!relation) {
        console.error(`Relation ${relationId} not found in OSM data`);
        return estimateDistanceFromStraightLine(straightLineDistance);
      }

      // Extract all ways in the correct order from the relation
      const orderedWays = [];
      if (relation.members) {
        relation.members.forEach((member) => {
          if (member.type === "way" && member.role !== "platform") {
            orderedWays.push(member.ref);
          }
        });
      }

      // Build the complete route as an ordered array of coordinates
      routeCoordinates = [];
      const processedWays = new Set();

      // First pass: add ways in the order specified by the relation
      orderedWays.forEach((wayId) => {
        data.elements.forEach((element) => {
          if (
            element.type === "way" &&
            element.id === wayId &&
            element.geometry
          ) {
            const wayCoordinates = element.geometry.map((point) => [
              point.lat,
              point.lon,
            ]);
            routeCoordinates.push(...wayCoordinates);
            processedWays.add(wayId);
          }
        });
      });

      // Second pass: add any remaining ways (fallback)
      if (routeCoordinates.length === 0) {
        data.elements.forEach((element) => {
          if (
            element.type === "way" &&
            element.geometry &&
            !processedWays.has(element.id)
          ) {
            const wayCoordinates = element.geometry.map((point) => [
              point.lat,
              point.lon,
            ]);
            routeCoordinates.push(...wayCoordinates);
          }
        });
      }

      if (routeCoordinates.length === 0) {
        console.error(`No coordinates found for route ${relationId}`);
        return estimateDistanceFromStraightLine(straightLineDistance);
      }

      // Store in cache for future use
      routeCoordinatesCache.set(relationId, routeCoordinates);
    }

    // Find the closest points on the route to the initial and final locations
    let closestInitialIndex = -1;
    let closestFinalIndex = -1;
    let minInitialDistance = Number.POSITIVE_INFINITY;
    let minFinalDistance = Number.POSITIVE_INFINITY;

    for (let i = 0; i < routeCoordinates.length; i++) {
      const [pointLat, pointLon] = routeCoordinates[i];

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

    // If we couldn't find closest points, return estimated distance
    if (closestInitialIndex === -1 || closestFinalIndex === -1) {
      console.error(`Couldn't find closest points on route ${relationId}`);
      return estimateDistanceFromStraightLine(straightLineDistance);
    }

    // Calculate the distance along the route between the closest points
    let totalDistance = 0;

    // Ensure we're calculating in the correct direction
    // For jeepney routes, we want to follow the route in its defined direction
    const startIndex = Math.min(closestInitialIndex, closestFinalIndex);
    const endIndex = Math.max(closestInitialIndex, closestFinalIndex);

    // Sum up distances between consecutive points
    for (let i = startIndex; i < endIndex; i++) {
      const [lat1, lon1] = routeCoordinates[i];
      const [lat2, lon2] = routeCoordinates[i + 1];
      totalDistance += calculateDistance(lat1, lon1, lat2, lon2);
    }

    // For debugging
    console.log(`Route ${relationId} travel distance: ${totalDistance} meters`);
    console.log(
      `From index ${startIndex} to ${endIndex} out of ${routeCoordinates.length} points`
    );

    // Sanity check: if the calculated distance is too small, it might be an error
    if (totalDistance < 100 && straightLineDistance) {
      console.warn(
        `Route ${relationId} calculated distance (${totalDistance}m) is too small. Using straight line estimate.`
      );
      return estimateDistanceFromStraightLine(straightLineDistance);
    }

    return Math.round(totalDistance);
  } catch (error) {
    if (error.name === "AbortError") {
      console.log(`Distance calculation for route ${relationId} was cancelled`);
      throw error;
    }
    console.error(
      `Error calculating travel distance for route ${relationId}:`,
      error
    );
    return estimateDistanceFromStraightLine(straightLineDistance);
  }
};

// Simple helper function to estimate distance from straight line
function estimateDistanceFromStraightLine(straightLineDistance) {
  if (!straightLineDistance) return 500; // Default fallback distance

  // Use a reasonable factor for street networks (typically 1.2-1.5 times straight line)
  const factor = 1.3;
  return Math.round(straightLineDistance * factor);
}
