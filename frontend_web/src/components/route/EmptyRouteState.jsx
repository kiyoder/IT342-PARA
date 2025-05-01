"use client";

import PropTypes from "prop-types";
import "../../styles/EmptyRouteState.css";

const EmptyRouteState = ({ onSearchClick }) => {
  return (
    <div className="empty-routes-container">
      <p>No saved routes yet</p>
      <button className="search-new-route-btn" onClick={onSearchClick}>
        Search routes
      </button>
    </div>
  );
};

EmptyRouteState.propTypes = {
  onSearchClick: PropTypes.func.isRequired,
};

export default EmptyRouteState;
