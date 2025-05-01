"use client";
import PropTypes from "prop-types";
import "../../styles/SavedRouteCard.css";

const SavedRouteCard = ({
  route,
  isSelected,
  onSelect,
  onDelete,
  isDeleting,
}) => {
  const formatDate = (d) =>
    new Date(d).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(route.relationId);
  };

  return (
    <div
      className={`saved-route-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(route)}
    >
      <div className="route-locations">
        <div className="location from-location">
          <div className="location-marker from-marker"></div>
          <div className="location-details">
            <span className="location-label">FROM</span>
            <span className="location-name">{route.fromName}</span>
          </div>
        </div>

        <div className="location to-location">
          <div className="location-marker to-marker"></div>
          <div className="location-details">
            <span className="location-label">TO</span>
            <span className="location-name">{route.toName}</span>
          </div>
        </div>
      </div>

      <div className="route-footer">
        <span className="route-date">{formatDate(route.createdAt)}</span>
        <button
          className={`delete-btn ${isDeleting ? "deleting" : ""}`}
          onClick={handleDelete}
          disabled={isDeleting}
        >
          {isDeleting ? "Deleting..." : "Delete"}
        </button>
      </div>
    </div>
  );
};

SavedRouteCard.propTypes = {
  route: PropTypes.shape({
    relationId: PropTypes.string.isRequired,
    fromName: PropTypes.string.isRequired,
    toName: PropTypes.string.isRequired,
    createdAt: PropTypes.string.isRequired,
    initialLat: PropTypes.number.isRequired,
    initialLon: PropTypes.number.isRequired,
    finalLat: PropTypes.number.isRequired,
    finalLon: PropTypes.number.isRequired,
  }).isRequired,
  isSelected: PropTypes.bool,
  onSelect: PropTypes.func.isRequired,
  onDelete: PropTypes.func.isRequired,
  isDeleting: PropTypes.bool,
};

SavedRouteCard.defaultProps = {
  isSelected: false,
  isDeleting: false,
};

export default SavedRouteCard;
