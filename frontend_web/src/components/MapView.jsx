import React from "react";
import "leaflet/dist/leaflet.css";
import { MapContainer, TileLayer } from "react-leaflet";

const MapView = () => {
  return (
    <div style={{ height: "100vh", width: "100vw" }}>
      <MapContainer
        center={[10.3157, 123.8854]} // Cebu City
        zoom={14} // Adjust zoom level if needed
        style={{ height: "100%", width: "100%" }}
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        />
      </MapContainer>
    </div>
  );
};

export default MapView;
