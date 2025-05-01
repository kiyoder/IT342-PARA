import "../../styles/RouteLoadingSpinner.css";

const RouteLoadingSpinner = ({ message = "Loading..." }) => {
  return (
    <div className="route-loading-container">
      <div className="route-loading-spinner">
        <div className="spinner-circle"></div>
        <div className="spinner-circle inner"></div>
      </div>
      <p className="loading-message">{message}</p>
    </div>
  );
};

export default RouteLoadingSpinner;
