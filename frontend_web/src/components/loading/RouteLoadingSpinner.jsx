import "../../styles/RouteLoadingSpinner.css";

const RouteLoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="route-loading-container">
      <div className="route-loading-spinner">
        <svg
          className="circular-spinner"
          width="60"
          height="60"
          viewBox="0 0 60 60"
        >
          {/* Background circle */}
          <circle
            className="spinner-background"
            cx="30"
            cy="30"
            r="25"
            strokeWidth="5"
            fill="transparent"
          />

          {/* Animated spinner circle */}
          <circle
            className="spinner-foreground"
            cx="30"
            cy="30"
            r="25"
            strokeWidth="5"
            fill="transparent"
          />
        </svg>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default RouteLoadingSpinner;
