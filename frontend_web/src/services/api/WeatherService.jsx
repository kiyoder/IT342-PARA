// Simple Weather service to fetch temperature data
const API_KEY = "37adbc1df68d54a44d9952c5c4493cdc"; // Free OpenWeatherMap API key

/**
 * Fetch current temperature for a specific location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<number|null>} - Temperature in Celsius or null if error
 */
export const fetchTemperature = async (lat, lon) => {
  try {
    // Validate inputs
    if (lat == null || lon == null || isNaN(lat) || isNaN(lon)) {
      console.error("Invalid coordinates:", { lat, lon });
      return null;
    }

    console.log(`Fetching weather for ${lat}, ${lon}`);

    // Add a timeout to the fetch request
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`,
      { signal: controller.signal }
    );

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Weather API error (${response.status}):`, errorText);
      throw new Error(
        `Weather API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    // Validate the response data
    if (!data || !data.main || data.main.temp === undefined) {
      console.error("Invalid weather data format:", data);
      throw new Error("Invalid weather data format");
    }

    console.log(`Weather data received for ${lat}, ${lon}:`, data.main);
    return Math.round(data.main.temp);
  } catch (error) {
    console.error("Error fetching temperature:", error);
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
  } catch (error) {
    console.error("Error caching temperature:", error);
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

    if (!data) return null;

    const now = new Date().getTime();
    if (now - data.timestamp > maxAge) {
      // Cache expired
      return null;
    }

    return data.temperature;
  } catch (error) {
    console.error("Error reading temperature cache:", error);
    // Clear cache if corrupted
    localStorage.removeItem("temperatureCache");
    return null;
  }
};
