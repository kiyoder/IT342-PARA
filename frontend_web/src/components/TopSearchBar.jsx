"use client";

import "../styles/TopSearchBar.css";
import { Search } from "lucide-react";
import { useLocation } from "./LocationContext";
import SearchResults from "./SearchResults";

const TopSearchBar = () => {
  const { searchQuery, setSearchQuery } = useLocation();

  return (
    <div className="top-search-bar">
      <div className="search-container">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Search location"
          className="search-input"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
        <button className="search-button">&gt;</button>

        {/* Add the search results dropdown */}
        <SearchResults />
      </div>
    </div>
  );
};

export default TopSearchBar;
