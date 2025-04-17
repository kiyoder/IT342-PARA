"use client";

import { useEffect, useState } from "react";
import "../../styles/LoadingOverlay.css";

const LoadingOverlay = ({
  isVisible,
  progress,
  totalRoutes,
  onComplete,
  onCancel,
}) => {
  const [animationComplete, setAnimationComplete] = useState(false);

  useEffect(() => {
    let timer;
    if (!isVisible && progress >= 100) {
      // Add a small delay before triggering the onComplete callback
      timer = setTimeout(() => {
        setAnimationComplete(true);
        if (onComplete) onComplete();
      }, 500);
    }

    return () => {
      if (timer) clearTimeout(timer);
    };
  }, [isVisible, progress, onComplete]);

  if (!isVisible) return null;

  const handleCancel = () => {
    if (onCancel) onCancel();
  };

  return (
    <div className={`loading-overlay ${animationComplete ? "fade-out" : ""}`}>
      <div className="loading-content">
        <div className="loading-text">LOADING...</div>
        <div className="progress-container">
          <div className="progress-bar" style={{ width: `${progress}%` }}></div>
        </div>
        <div className="progress-text">
          Scanning routes:{" "}
          {Math.min(Math.floor((progress / 100) * totalRoutes), totalRoutes)} of{" "}
          {totalRoutes}
        </div>
        <div className="cancel-text" onClick={handleCancel}>
          Do you want to cancel this process?
        </div>
      </div>
    </div>
  );
};

export default LoadingOverlay;
