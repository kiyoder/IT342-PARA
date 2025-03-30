import "../styles/TopSearchBar.css";
import { Search } from "lucide-react";

const TopSearchBar = () => {
  return (
    <div className="top-search-bar">
      <div className="search-container">
        <Search className="search-icon" />
        <input
          type="text"
          placeholder="Search location"
          className="search-input"
        />
        <button className="search-button">&gt;</button>
      </div>
    </div>
  );
};

export default TopSearchBar;
