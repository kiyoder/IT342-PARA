// Service to handle route-related API calls and calculations
import axios from "axios";

const API_BASE_URL = `${import.meta.env.VITE_API_BASE_URL}/api`;

const getAuthHeaders = () => {
  const token = localStorage.getItem("token");

  // If no token is found, throw an error or return an empty header
  if (!token) {
    throw new Error("Authentication token is required");
  }

  return {
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  };
};

export const getSavedRoutes = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/saved-routes`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    handleAxiosError(error, "fetching saved routes");
  }
};

export const saveRoute = async (routeData) => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/saved-routes`,
      routeData,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    handleAxiosError(error, "saving route");
  }
};

export const deleteSavedRoute = async (relationId) => {
  try {
    const response = await axios.delete(`${API_BASE_URL}/saved-routes`, {
      ...getAuthHeaders(),
      params: { relationId },
    });
    return response.data;
  } catch (error) {
    handleAxiosError(error, "deleting saved route");
  }
};

export const isRouteSaved = async (relationId) => {
  try {
    const response = await axios.get(`${API_BASE_URL}/saved-routes/check`, {
      ...getAuthHeaders(),
      params: { relationId },
    });
    return response.data.isSaved;
  } catch (error) {
    console.error("Error checking if route is saved:", error);
    return false;
  }
};

export const fetchAllRoutes = async () => {
  try {
    const response = await axios.get(
      `${API_BASE_URL}/routes/`,
      getAuthHeaders()
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching routes:", error);
    return [];
  }
};

export const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371e3;
  const φ1 = (lat1 * Math.PI) / 180;
  const φ2 = (lat2 * Math.PI) / 180;
  const Δφ = ((lat2 - lat1) * Math.PI) / 180;
  const Δλ = ((lon2 - lon1) * Math.PI) / 180;

  const a =
    Math.sin(Δφ / 2) ** 2 + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
};

export const routePassesNearPoint = async (
  relationId,
  lat,
  lon,
  maxDistance = 100,
  signal
) => {
  try {
    const query = `
      [out:json][timeout:25];
      relation(${relationId});
      >>;
      out geom;
    `;

    const response = await axios.post(
      "https://overpass-api.de/api/interpreter",
      query,
      { signal }
    );

    const coordinates = [];
    response.data.elements.forEach((element) => {
      if (element.type === "way" && element.geometry) {
        element.geometry.forEach((point) => {
          coordinates.push([point.lat, point.lon]);
        });
      }
    });

    for (const [pointLat, pointLon] of coordinates) {
      const distance = calculateDistance(lat, lon, pointLat, pointLon);
      if (distance <= maxDistance) {
        return true;
      }
    }

    return false;
  } catch (error) {
    if (axios.isCancel(error)) {
      console.log(`Search for route ${relationId} was cancelled`);
    } else {
      console.error(
        `Error checking if route ${relationId} passes near point:`,
        error
      );
    }
    return false;
  }
};

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
    const allRoutes = await fetchAllRoutes();
    const totalRoutes = allRoutes.length;

    const straightLineDistance = calculateDistance(
      initialLat,
      initialLon,
      finalLat,
      finalLon
    );
    const matchingRoutes = [];

    for (let i = 0; i < totalRoutes; i++) {
      if (signal?.aborted)
        throw new DOMException("Search cancelled", "AbortError");

      const route = allRoutes[i];
      if (onProgress) onProgress(Math.round(((i + 1) / totalRoutes) * 100));
      await new Promise((resolve) => setTimeout(resolve, 100));

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
          const travelDistance = await calculateRouteDistance(
            route.relationId,
            initialLat,
            initialLon,
            finalLat,
            finalLon,
            straightLineDistance,
            signal
          );
          matchingRoutes.push({ ...route, distance: travelDistance });
        }
      }
    }

    if (onProgress && !signal?.aborted) onProgress(100);
    return matchingRoutes;
  } catch (error) {
    if (error.name === "AbortError") console.log("Route search cancelled");
    if (onProgress && !signal?.aborted) onProgress(100);
    return [];
  }
};

const routeCoordinatesCache = new Map();

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
    let routeCoordinates = routeCoordinatesCache.get(relationId);

    if (!routeCoordinates) {
      const query = `
        [out:json][timeout:25];
        relation(${relationId});
        >>;
        out geom;
      `;

      const response = await axios.post(
        "https://overpass-api.de/api/interpreter",
        query,
        { signal }
      );

      const coordinates = [];
      response.data.elements.forEach((element) => {
        if (element.type === "way" && element.geometry) {
          element.geometry.forEach((point) => {
            coordinates.push([point.lat, point.lon]);
          });
        }
      });

      routeCoordinates = coordinates;
      routeCoordinatesCache.set(relationId, routeCoordinates);
    }

    // Simplified distance logic: find closest points in the route
    let minInitialDist = Infinity;
    let minFinalDist = Infinity;

    for (const [lat, lon] of routeCoordinates) {
      const distToInitial = calculateDistance(lat, lon, initialLat, initialLon);
      const distToFinal = calculateDistance(lat, lon, finalLat, finalLon);

      if (distToInitial < minInitialDist) minInitialDist = distToInitial;
      if (distToFinal < minFinalDist) minFinalDist = distToFinal;
    }

    return minInitialDist + minFinalDist;
  } catch (error) {
    console.error(`Error calculating route distance for ${relationId}:`, error);
    return straightLineDistance ?? 0;
  }
};

const handleAxiosError = (error, context) => {
  if (error.response?.status === 401) {
    throw new Error("Authentication required");
  }
  console.error(`Error ${context}:`, error);
  throw error;
};
