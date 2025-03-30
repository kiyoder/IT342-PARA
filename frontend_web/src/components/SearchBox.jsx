"use client";

import { FaSearch } from "react-icons/fa";
import { FaArrowRightArrowLeft } from "react-icons/fa6";
import "../styles/SearchBox.css";
import { useLocation } from "./LocationContext";

const SearchBox = () => {
  const {
    initialLocation,
    updateInitialLocation,
    finalDestination,
    updateFinalDestination,
    handleInitialFocus,
    handleInitialBlur,
    handleFinalFocus,
    handleFinalBlur,
    swapLocations,
  } = useLocation();

  return (
    <div className="search-box">
      <h2>Where would you like to go today?</h2>

      <div className="input-container">
        <div className="inputs">
          <div className="input-row">
            <div className="icon-container">
              <svg
                width="30"
                height="30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_39_2675)">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M15 8.61335C15 9.82975 13.8813 10.815 12.5 10.815C11.1188 10.815 10 9.82975 10 8.61335C10 7.39694 11.1188 6.4117 12.5 6.4117C13.8813 6.4117 15 7.39694 15 8.61335ZM12.5 19.3802C12.5 19.3802 6.25 11.6745 6.25 8.372C6.25 5.33704 9.05375 2.8679 12.5 2.8679C15.9462 2.8679 18.75 5.33704 18.75 8.372C18.75 11.6745 12.5 19.3802 12.5 19.3802ZM12.5 0.66626C7.6675 0.66626 3.75 4.11623 3.75 8.372C3.75 12.6278 12.5 22.6827 12.5 22.6827C12.5 22.6827 21.25 12.6278 21.25 8.372C21.25 4.11623 17.3325 0.66626 12.5 0.66626Z"
                    fill="#FF3B10"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_39_2675">
                    <rect
                      width="30"
                      height="30"
                      fill="white"
                      transform="translate(0 0.147705)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Select Initial Location"
              value={initialLocation}
              onChange={(e) => updateInitialLocation(e.target.value)}
              onFocus={handleInitialFocus}
              onBlur={handleInitialBlur}
            />
          </div>
          <div className="input-row">
            <div className="icon-container">
              <svg
                width="30"
                height="30"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g clipPath="url(#clip0_39_2675)">
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M12.5 10.2964C11.1188 10.2964 10 9.3112 10 8.09479C10 6.87838 11.1188 5.89315 12.5 5.89315C13.8813 5.89315 15 6.87838 15 8.09479C15 9.3112 13.8813 10.2964 12.5 10.2964ZM12.5 0.147705C7.6675 0.147705 3.75 3.59768 3.75 7.85345C3.75 12.1092 12.5 22.1641 12.5 22.1641C12.5 22.1641 21.25 12.1092 21.25 7.85345C21.25 3.59768 17.3325 0.147705 12.5 0.147705Z"
                    fill="#FF3B10"
                  />
                </g>
                <defs>
                  <clipPath id="clip0_39_2675">
                    <rect
                      width="30"
                      height="30"
                      fill="white"
                      transform="translate(0 0.147705)"
                    />
                  </clipPath>
                </defs>
              </svg>
            </div>
            <input
              type="text"
              placeholder="Select Final Destination"
              value={finalDestination}
              onChange={(e) => updateFinalDestination(e.target.value)}
              onFocus={handleFinalFocus}
              onBlur={handleFinalBlur}
            />
          </div>
        </div>

        <button className="swap-btn" onClick={swapLocations}>
          <FaArrowRightArrowLeft className="swap-icon" />
        </button>
      </div>

      <button className="search-btn">
        <FaSearch className="search-icon" /> SEARCH
      </button>
    </div>
  );
};

export default SearchBox;
