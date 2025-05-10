import { debug, info, error } from "../utils/logger";

// Simple Weather service to fetch temperature data
const API_KEY = "37adbc1df68d54a44d9952c5c4493cdc"; // Free OpenWeatherMap API key
const CONTEXT = "WeatherService"; // Context for logging

/**
 * Normalize coordinates to ensure consistent format
 * @param {Object} coords - Coordinates object with either lat/lon or latitude/longitude
 * @returns {Object|null} - Normalized coordinates {lat, lon} or null if invalid
 */
export const normalizeCoordinates = (coords) => {
  try {
    // Extract lat/lon from either format
    const lat = coords.latitude !== undefined ? coords.latitude : coords.lat;
    const lon = coords.longitude !== undefined ? coords.longitude : coords.lon;

    // Convert to numbers and validate
    const numLat = Number(lat);
    const numLon = Number(lon);

    if (isNaN(numLat) || isNaN(numLon)) {
      error(CONTEXT, "Invalid coordinates in normalization", { coords });
      return null;
    }

    return { lat: numLat, lon: numLon };
  } catch (err) {
    error(CONTEXT, "Error normalizing coordinates", {
      error: err.message,
      coords,
    });
    return null;
  }
};

/**
 * Fetch current temperature for a specific location
 * @param {Object} coords - Coordinates object with either lat/lon or latitude/longitude
 * @returns {Promise<number|null>} - Temperature in Celsius or null if error
 */
export const fetchTemperature = async (coords) => {
  const requestId = `req_${Math.random().toString(36).substring(2, 10)}`;

  try {
    // Normalize coordinates
    const normalizedCoords = normalizeCoordinates(coords);
    if (!normalizedCoords) {
      error(CONTEXT, `Invalid coordinates [${requestId}]`, { coords });
      return null;
    }

    const { lat, lon } = normalizedCoords;

    info(CONTEXT, `Fetching weather [${requestId}]`, { lat, lon });

    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => {
      controller.abort();
      error(CONTEXT, `Request timeout [${requestId}]`, { lat, lon });
    }, 10000); // 10 second timeout

    const url = `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`;
    debug(CONTEXT, `Request URL [${requestId}]`, {
      url: url.replace(API_KEY, "API_KEY_HIDDEN"),
    });

    const startTime = Date.now();
    const response = await fetch(url, { signal: controller.signal });
    const responseTime = Date.now() - startTime;

    clearTimeout(timeoutId);

    info(CONTEXT, `Response received [${requestId}]`, {
      status: response.status,
      statusText: response.statusText,
      responseTime: `${responseTime}ms`,
    });

    if (!response.ok) {
      const errorText = await response.text();
      error(CONTEXT, `API error [${requestId}]`, {
        status: response.status,
        statusText: response.statusText,
        body: errorText,
      });
      throw new Error(
        `Weather API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    debug(CONTEXT, `Response data [${requestId}]`, data);

    // Validate the response data
    if (!data || !data.main || data.main.temp === undefined) {
      error(CONTEXT, `Invalid data format [${requestId}]`, data);
      throw new Error("Invalid weather data format");
    }

    const temp = Math.round(data.main.temp);
    info(CONTEXT, `Weather data processed [${requestId}]`, {
      location: `${lat},${lon}`,
      temp,
      weather: data.weather?.[0]?.main,
    });

    return temp;
  } catch (err) {
    // Check if it's an abort error
    if (err.name === "AbortError") {
      error(CONTEXT, `Request aborted [${requestId}]`, { coords });
      return null;
    }

    error(CONTEXT, `Error fetching temperature [${requestId}]`, {
      message: err.message,
      stack: err.stack,
      coords,
    });
    return null;
  }
};

/**
 * Cache temperature data to avoid excessive API calls
 * @param {number} temperature - Temperature to cache
 * @param {string} key - Cache key (usually lat,lon)
 */
export const cacheTemperature = (temperature, key) => {
  if (temperature === null) return;

  try {
    const cache = JSON.parse(localStorage.getItem("temperatureCache") || "{}");
    cache[key] = {
      temperature,
      timestamp: new Date().getTime(),
    };

    localStorage.setItem("temperatureCache", JSON.stringify(cache));
    debug(CONTEXT, "Temperature cached", { key, temperature });
  } catch (err) {
    error(CONTEXT, "Error caching temperature", { key, error: err.message });
    // Clear cache if corrupted
    localStorage.removeItem("temperatureCache");
  }
};

/**
 * Get cached temperature if available and not expired
 * @param {string} key - Cache key (usually lat,lon)
 * @param {number} maxAge - Maximum age of cache in milliseconds (default 30 minutes)
 * @returns {number|null} - Cached temperature or null if expired/not found
 */
export const getCachedTemperature = (key, maxAge = 30 * 60 * 1000) => {
  try {
    const cache = JSON.parse(localStorage.getItem("temperatureCache") || "{}");
    const data = cache[key];

    if (!data) {
      debug(CONTEXT, "No cached data found", { key });
      return null;
    }

    const now = new Date().getTime();
    if (now - data.timestamp > maxAge) {
      // Cache expired
      debug(CONTEXT, "Cache expired", {
        key,
        age: `${Math.round((now - data.timestamp) / 1000)}s`,
        maxAge: `${Math.round(maxAge / 1000)}s`,
      });
      return null;
    }

    debug(CONTEXT, "Using cached temperature", {
      key,
      temperature: data.temperature,
      age: `${Math.round((now - data.timestamp) / 1000)}s`,
    });
    return data.temperature;
  } catch (err) {
    error(CONTEXT, "Error reading temperature cache", {
      key,
      error: err.message,
    });
    // Clear cache if corrupted
    localStorage.removeItem("temperatureCache");
    return null;
  }
};

// Fallback temperature data for Cebu City
const CEBU_FALLBACK_TEMPS = {
  // Average temperatures for Cebu City by month (in Celsius)
  1: 27,
  2: 27,
  3: 28,
  4: 29,
  5: 30,
  6: 29,
  7: 29,
  8: 29,
  9: 29,
  10: 29,
  11: 28,
  12: 28,
};

/**
 * Get fallback temperature for a location
 * Uses average temperature data for Cebu or nearby locations
 * @param {Object} coords - Coordinates object with either lat/lon or latitude/longitude
 * @returns {number} - Estimated temperature in Celsius
 */
export const getFallbackTemperature = (coords) => {
  const normalizedCoords = normalizeCoordinates(coords);
  if (!normalizedCoords) {
    return 28; // Default fallback
  }

  const { lat, lon } = normalizedCoords;

  // Check if coordinates are in Cebu area (approximate)
  const isCebuArea = lat >= 9.5 && lat <= 11.5 && lon >= 123 && lon <= 124.5;

  if (isCebuArea) {
    const currentMonth = new Date().getMonth() + 1; // 1-12
    return CEBU_FALLBACK_TEMPS[currentMonth];
  }

  // Default fallback for other areas
  return 28; // Average temperature for Philippines
};
