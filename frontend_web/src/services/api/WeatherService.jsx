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
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();
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

  const cache = JSON.parse(localStorage.getItem("temperatureCache") || "{}");
  cache[key] = {
    temperature,
    timestamp: new Date().getTime(),
  };

  localStorage.setItem("temperatureCache", JSON.stringify(cache));
};

/**
 * Get cached temperature if available and not expired
 * @param {string} key - Cache key (usually lat,lon)
 * @param {number} maxAge - Maximum age of cache in milliseconds (default 30 minutes)
 * @returns {number|null} - Cached temperature or null if expired/not found
 */
export const getCachedTemperature = (key, maxAge = 30 * 60 * 1000) => {
  const cache = JSON.parse(localStorage.getItem("temperatureCache") || "{}");
  const data = cache[key];

  if (!data) return null;

  const now = new Date().getTime();
  if (now - data.timestamp > maxAge) {
    // Cache expired
    return null;
  }

  return data.temperature;
};
