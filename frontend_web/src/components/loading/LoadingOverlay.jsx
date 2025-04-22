"use client";

import { useEffect } from "react";
import "../../styles/LoadingOverlay.css";

const LoadingOverlay = ({
  isVisible,
  progress,
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

  return (
    <div className="loading-overlay">
      <div className="loading-content">
        <h2>Searching for Routes</h2>
        <div className="progress-container">
          <div className="progress-bar">
            <div
              className="progress-fill"
              style={{ width: `${progress}%` }}
            ></div>
          </div>
          <div className="progress-text">{progress}%</div>
        </div>
        <p className="status-text">
          Scanning through {totalRoutes} routes to find the best match for your
          journey...
        </p>
        <p className="cancel-text" onClick={onCancel}>
          Do you want to cancel this process?
        </p>
      </div>
    </div>
  );
};

export default LoadingOverlay;
