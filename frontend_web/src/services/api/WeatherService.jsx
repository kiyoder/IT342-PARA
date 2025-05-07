// Weather service to fetch weather data from OpenWeatherMap API
const API_KEY = "4da2a855f0c9c4f7fd9a7d3b7b4c67a3"; // Free OpenWeatherMap API key

/**
 * Fetch current weather data for a specific location
 * @param {number} lat - Latitude
 * @param {number} lon - Longitude
 * @returns {Promise<Object>} - Weather data
 */
export const fetchWeatherData = async (lat, lon) => {
  try {
    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=metric&appid=${API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Weather API error: ${response.statusText}`);
    }

    const data = await response.json();
    return {
      temperature: Math.round(data.main.temp),
      condition: data.weather[0].main,
      description: data.weather[0].description,
      icon: data.weather[0].icon,
      humidity: data.main.humidity,
      windSpeed: data.wind.speed,
      cityName: data.name,
      timestamp: new Date().getTime(),
    };
  } catch (error) {
    console.error("Error fetching weather data:", error);
    return null;
  }
};

/**
 * Get weather icon URL from icon code
 * @param {string} iconCode - Weather icon code from API
 * @returns {string} - URL to the weather icon
 */
export const getWeatherIconUrl = (iconCode) => {
  return `https://openweathermap.org/img/wn/${iconCode}@2x.png`;
};

/**
 * Get appropriate emoji for weather condition
 * @param {string} condition - Weather condition
 * @returns {string} - Emoji representing the weather condition
 */
export const getWeatherEmoji = (condition) => {
  const conditionLower = condition.toLowerCase();

  if (conditionLower.includes("clear")) return "☀️";
  if (conditionLower.includes("cloud")) return "☁️";
  if (conditionLower.includes("rain")) return "🌧️";
  if (conditionLower.includes("thunder")) return "⛈️";
  if (conditionLower.includes("snow")) return "❄️";
  if (conditionLower.includes("mist") || conditionLower.includes("fog"))
    return "🌫️";
  if (conditionLower.includes("drizzle")) return "🌦️";

  return "🌡️"; // Default
};

/**
 * Cache weather data to avoid excessive API calls
 * @param {Object} weatherData - Weather data to cache
 * @param {string} key - Cache key (usually lat,lon)
 */
export const cacheWeatherData = (weatherData, key) => {
  if (!weatherData) return;

  const cache = JSON.parse(localStorage.getItem("weatherCache") || "{}");
  cache[key] = {
    ...weatherData,
    timestamp: new Date().getTime(),
  };

  localStorage.setItem("weatherCache", JSON.stringify(cache));
};

/**
 * Get cached weather data if available and not expired
 * @param {string} key - Cache key (usually lat,lon)
 * @param {number} maxAge - Maximum age of cache in milliseconds (default 30 minutes)
 * @returns {Object|null} - Cached weather data or null if expired/not found
 */
export const getCachedWeatherData = (key, maxAge = 30 * 60 * 1000) => {
  const cache = JSON.parse(localStorage.getItem("weatherCache") || "{}");
  const data = cache[key];

  if (!data) return null;

  const now = new Date().getTime();
  if (now - data.timestamp > maxAge) {
    // Cache expired
    return null;
  }

  return data;
};
