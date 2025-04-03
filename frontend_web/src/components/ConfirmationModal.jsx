"use client";
import "../styles/ConfirmationModal.css";

const ConfirmationModal = ({
  location,
  onConfirm,
  onCancel,
  title = "Confirm Destination",
}) => {
  if (!location) return null;

  return (
    <div className="modal-overlay">
      <div className="confirmation-modal">
        <h3>{title}</h3>
        <p>Do you want to set this as your location?</p>

        <div className="modal-location-details">
          <div className="modal-location-name">
            {location.name.split(",")[0]}
          </div>
          <div className="modal-location-address">{location.name}</div>
          {location.distance !== undefined && (
            <div className="modal-location-distance">
              {location.distance < 1000
                ? `${Math.round(location.distance)}m away`
                : `${(location.distance / 1000).toFixed(1)}km away`}
            </div>
          )}
        </div>

        <div className="modal-buttons">
          <button className="cancel-btn" onClick={onCancel}>
            No, Cancel
          </button>
          <button className="confirm-btn" onClick={onConfirm}>
            Yes, Confirm
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
