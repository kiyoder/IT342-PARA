import React from "react";
import "../styles/SearchBox.css";

const SearchBox = () => {
  return (
    <div className="search-box">
      <h2>Where would you like to go today?</h2>
      <div className="input-group">
        <input type="text" placeholder="Current location or choose..." />
        <input type="text" placeholder="Destination" />
      </div>
      <button className="search-btn">🔍 SEARCH</button>
    </div>
  );
};

export default SearchBox;
