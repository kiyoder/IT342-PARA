import { debug, info, error } from "../utils/logger";

// Simple Weather service to fetch temperature data
const API_KEY = "37adbc1df68d54a44d9952c5c4493cdc"; // Free OpenWeatherMap API key
const CONTEXT = "WeatherService"; // Context for logging

/**
 * Fetch current temperature for a specific location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<number|null>} - Temperature in Celsius or null if error
 */
export const fetchTemperature = async (lat, lon) => {
  const requestId = `req_${Math.random().toString(36).substring(2, 10)}`;

  try {
    // Validate inputs
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
      error(CONTEXT, `Invalid coordinates [${requestId}]`, { lat, lon });
      return null;
    }

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
      error(CONTEXT, `Request aborted [${requestId}]`, { lat, lon });
      return null;
    }

    error(CONTEXT, `Error fetching temperature [${requestId}]`, {
      message: err.message,
      stack: err.stack,
      lat,
      lon,
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

/**
 * Test the weather service with a known location
 * Useful for debugging API issues
 */
export const testWeatherService = async () => {
  info(CONTEXT, "Testing weather service");

  // Test with a known location (New York)
  const lat = 40.7128;
  const lon = -74.006;

  try {
    // Clear any existing cache for this location
    const cacheKey = `${lat.toFixed(4)},${lon.toFixed(4)}`;
    const cache = JSON.parse(localStorage.getItem("temperatureCache") || "{}");
    delete cache[cacheKey];
    localStorage.setItem("temperatureCache", JSON.stringify(cache));

    info(CONTEXT, "Cache cleared for test location", { lat, lon });

    // Test the API
    const temp = await fetchTemperature(lat, lon);

    if (temp === null) {
      error(CONTEXT, "Test failed - null temperature returned", { lat, lon });
      return { success: false, message: "API call failed" };
    }

    info(CONTEXT, "Test successful", { lat, lon, temp });
    return { success: true, temperature: temp };
  } catch (err) {
    error(CONTEXT, "Test failed with exception", {
      error: err.message,
      stack: err.stack,
    });
    return { success: false, error: err.message };
  }
};
