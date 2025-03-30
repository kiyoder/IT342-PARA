import { FaSearch, FaMapMarkerAlt } from "react-icons/fa";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import "../styles/SearchBox.css";

const SearchBox = () => {
  return (
    <div className="search-box">
      <h2>Where would you like to go today?</h2>

      <div className="input-container">
        <div className="inputs">
          <div className="input-row">
            <div className="icon-container">
              <FaMapMarkerAlt className="location-icon" />
            </div>
            <input type="text" placeholder="Current location or choose..." />
          </div>

          <div className="input-row">
            <div className="icon-container">
              <FaMapMarkerAlt className="location-icon" />
            </div>
            <input type="text" placeholder="Destination" />
          </div>
        </div>

        <button className="swap-btn">
          <FaArrowRightArrowLeft />
        </button>
      </div>

      <button className="search-btn">
        <FaSearch className="search-icon" /> SEARCH
      </button>
    </div>
  );
};

export default SearchBox;
