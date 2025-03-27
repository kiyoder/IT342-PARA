import React from "react";
import "../styles/SearchBox.css";
import { FaSearch, FaMapMarkerAlt, FaExchangeAlt } from "react-icons/fa";

const SearchBox = () => {
  return (
    <div className="search-box">
      <h2>Where would you like to go today?</h2>

      <div className="input-container">
        <div className="inputs">
          <div className="input-box">
            <FaMapMarkerAlt className="icon" />
            <input type="text" placeholder="Current location or choose..." />
          </div>

          <div className="input-box">
            <FaMapMarkerAlt className="icon" />
            <input type="text" placeholder="Destination" />
          </div>
        </div>

        <button className="swap-btn">
          <FaExchangeAlt />
        </button>
      </div>

      <button className="search-btn">
        <FaSearch className="search-icon" /> SEARCH
      </button>
    </div>
  );
};

export default SearchBox;
