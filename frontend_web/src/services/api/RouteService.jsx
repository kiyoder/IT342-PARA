// Service to handle route-related API calls and calculations

// Fetch all available routes from the backend
export const fetchAllRoutes = async () => {
  try {
    const response = await fetch("http://localhost:8080/api/routes/all", {
      method: "GET",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      throw new Error(`Error ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
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
          matchingRoutes.push({
            routeNumber: route.routeNumber,
            relationId: route.relationId,
            locations: route.locations,
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
