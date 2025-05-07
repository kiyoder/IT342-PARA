"use client";

import { useState, useEffect } from "react";
import {
  fetchWeatherData,
  getWeatherEmoji,
  getCachedWeatherData,
  cacheWeatherData,
} from "../../services/api/WeatherService";
import "../../styles/WeatherWidget.css";

const WeatherWidget = ({ latitude, longitude }) => {
  const [weatherData, setWeatherData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!latitude || !longitude) return;

    const fetchWeather = async () => {
      setLoading(true);
      setError(null);

      try {
        // Check cache first
        const cacheKey = `${latitude.toFixed(2)},${longitude.toFixed(2)}`;
        const cachedData = getCachedWeatherData(cacheKey);

        if (cachedData) {
          setWeatherData(cachedData);
          setLoading(false);
          return;
        }

        // Fetch fresh data if no cache
        const data = await fetchWeatherData(latitude, longitude);

        if (data) {
          setWeatherData(data);
          // Cache the result
          cacheWeatherData(data, cacheKey);
        } else {
          setError("Unable to fetch weather data");
        }
      } catch (err) {
        console.error("Weather widget error:", err);
        setError("Error loading weather data");
      } finally {
        setLoading(false);
      }
    };

    fetchWeather();
  }, [latitude, longitude]);

  if (loading) {
    return (
      <div className="weather-widget weather-loading">
        <div className="weather-spinner"></div>
        <div>Loading weather...</div>
      </div>
    );
  }

  if (error || !weatherData) {
    return (
      <div className="weather-widget weather-error">
        <div>{error || "Weather unavailable"}</div>
      </div>
    );
  }

  return (
    <div className="weather-widget">
      <div className="weather-main">
        <div className="weather-icon">
          {getWeatherEmoji(weatherData.condition)}
        </div>
        <div className="weather-temp">{weatherData.temperature}°C</div>
      </div>
      <div className="weather-details">
        <div className="weather-condition">{weatherData.description}</div>
        <div className="weather-location">{weatherData.cityName}</div>
        <div className="weather-meta">
          <span>Humidity: {weatherData.humidity}%</span>
          <span>Wind: {weatherData.windSpeed} m/s</span>
        </div>
      </div>
    </div>
  );
};

export default WeatherWidget;
