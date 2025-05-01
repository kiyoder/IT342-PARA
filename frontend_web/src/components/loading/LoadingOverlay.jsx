"use client";

import { useEffect } from "react";
import "../../styles/LoadingOverlay.css";

const LoadingOverlay = ({
  isVisible,
  progress = 0,
  totalRoutes,
  onComplete,
  onCancel,
}) => {
  useEffect(() => {
    // Auto-complete when progress reaches 100%
    if (progress >= 100 && onComplete) {
      const timer = setTimeout(() => {
        onComplete();
      }, 500); // Small delay to show 100% before completing
      return () => clearTimeout(timer);
    }
  }, [progress, onComplete]);

  if (!isVisible) return null;

  // Calculate the circle's circumference and the filled portion
  const radius = 60;
  const circumference = 2 * Math.PI * radius;
  const fillPercentage = ((100 - progress) / 100) * circumference;

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <h2>Searching for Routes</h2>

        <div className="circular-progress-container">
          <svg
            className="circular-progress"
            width="150"
            height="150"
            viewBox="0 0 150 150"
          >
            {/* Background circle */}
            <circle
              className="progress-background"
              cx="75"
              cy="75"
              r={radius}
              strokeWidth="10"
              fill="transparent"
            />

            {/* Progress circle that fills up */}
            <circle
              className="progress-indicator"
              cx="75"
              cy="75"
              r={radius}
              strokeWidth="10"
              fill="transparent"
              strokeDasharray={circumference}
              strokeDashoffset={fillPercentage}
              transform="rotate(-90, 75, 75)"
            />

            {/* Percentage text in the middle */}
            <text
              x="75"
              y="75"
              textAnchor="middle"
              dominantBaseline="middle"
              className="progress-percentage"
            >
              {Math.round(progress)}%
            </text>
          </svg>
        </div>

        <p className="status-text">
          Scanning through {totalRoutes} routes to find the best match for your
          journey...
        </p>

        {onCancel && (
          <p className="cancel-text" onClick={onCancel}>
            Do you want to cancel this process?
          </p>
        )}
      </div>
    </div>
  );
};

export default LoadingOverlay;
