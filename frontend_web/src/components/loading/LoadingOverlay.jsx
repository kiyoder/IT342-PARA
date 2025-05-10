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
  const outerRadius = 60;
  const innerRadius = 40;
  const outerCircumference = 2 * Math.PI * outerRadius;
  const innerCircumference = 2 * Math.PI * innerRadius;
  const outerFillPercentage = ((100 - progress) / 100) * outerCircumference;
  const innerFillPercentage = ((100 - progress) / 100) * innerCircumference;

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
            {/* Outer circle background */}
            <circle
              className="progress-background"
              cx="75"
              cy="75"
              r={outerRadius}
              strokeWidth="8"
              fill="transparent"
            />

            {/* Outer circle progress */}
            <circle
              className="progress-indicator"
              cx="75"
              cy="75"
              r={outerRadius}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={outerCircumference}
              strokeDashoffset={outerFillPercentage}
              transform="rotate(-90, 75, 75)"
            />

            {/* Inner circle background */}
            <circle
              className="progress-background"
              cx="75"
              cy="75"
              r={innerRadius}
              strokeWidth="8"
              fill="transparent"
            />

            {/* Inner circle progress */}
            <circle
              className="progress-indicator inner"
              cx="75"
              cy="75"
              r={innerRadius}
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={innerCircumference}
              strokeDashoffset={innerFillPercentage}
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
