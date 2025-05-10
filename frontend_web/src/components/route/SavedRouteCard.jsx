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

  // Format address to show main street name and simplified address
  const formatAddress = (fullAddress) => {
    if (!fullAddress) return { main: "", sub: "" };

    // Extract the main street name (first part before the comma)
    const parts = fullAddress.split(",");
    const mainPart = parts[0].trim();

    // Create a simplified sub-address (city, postal code, country)
    // Format: "Street, City Postal, Country"
    let cityPart = "";
    if (parts.length >= 3) {
      // Try to extract city and postal code
      const cityMatch = parts.find((part) =>
        part.toLowerCase().includes("city")
      );
      const postalMatch = parts.find((part) => /\d{4,}/.test(part));

      if (cityMatch) {
        cityPart += cityMatch.trim();
      }

      if (postalMatch) {
        const postal = postalMatch.match(/\d{4,}/)[0];
        cityPart += " " + postal;
      }

      // Add country if available
      if (parts[parts.length - 1].trim().toLowerCase() === "philippines") {
        cityPart += ", " + "Cebu";
      }
    }

    return {
      main: mainPart,
      sub: cityPart || parts.slice(1, 3).join(", ").trim(),
    };
  };

  const fromAddress = formatAddress(route.fromName);
  const toAddress = formatAddress(route.toName);

  const handleDelete = (e) => {
    e.stopPropagation();
    onDelete(route.relationId);
  };

  return (
    <div
      className={`saved-route-card ${isSelected ? "selected" : ""}`}
      onClick={() => onSelect(route)}
    >
      {route.routeNumber && (
        <div className="route-number-badge">{route.routeNumber}</div>
      )}

      <div className="route-locations">
        <div className="location from-location">
          <div className="location-marker from-marker"></div>
          <div className="location-details">
            <span className="location-label">FROM</span>
            <div className="address-container">
              <span className="address-main">{fromAddress.main}</span>
              <span className="address-sub">{fromAddress.sub}</span>
            </div>
          </div>
        </div>

        <div className="location to-location">
          <div className="location-marker to-marker"></div>
          <div className="location-details">
            <span className="location-label">TO</span>
            <div className="address-container">
              <span className="address-main">{toAddress.main}</span>
              <span className="address-sub">{toAddress.sub}</span>
            </div>
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
    routeNumber: PropTypes.string,
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
