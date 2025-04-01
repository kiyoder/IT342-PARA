"use client";

import { useEffect, useRef, useState } from "react";
import axios from "axios";
import "../styles/ProfileMenu.css";

const ProfileMenu = () => {
  const [isRotating, setIsRotating] = useState(false);
  const [rotationDirection, setRotationDirection] = useState("clockwise");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const [user, setUser] = useState({ username: "", profileImage: null });
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const actionIntentRef = useRef(null); // To track whether we're opening or closing

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found, redirecting to login...");
          window.location.href = "/login";
          return;
        }

        return await axios.get(
          "http://localhost:8080/api/users/fetch-username",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
      } catch (error) {
        console.error("Error fetching user data:", error);
        throw error;
      }
    };

    fetchUser()
      .then((response) => {
        if (response) {
          setUser({
            username: response.data.username,
            profileImage: response.data.profileImage,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to fetch user:", err);
      });
  }, []);

  const handleClick = () => {
    // Set the action intent based on current menu state
    if (isMenuOpen && !isMenuClosing) {
      actionIntentRef.current = "close";
    } else if (!isMenuOpen && !isRotating) {
      actionIntentRef.current = "open";
    } else {
      // If we're in the middle of an animation, don't do anything
      return;
    }

    setIsRotating(true);
    setRotationDirection(isMenuOpen ? "counterclockwise" : "clockwise");

    if (isMenuOpen) {
      // Start closing animation
      setIsMenuClosing(true);
    }
  };

  // Start closing the menu with rotation
  const closeMenuWithRotation = () => {
    actionIntentRef.current = "close";
    setRotationDirection("counterclockwise");
    setIsRotating(true);
    setIsMenuClosing(true);
  };

  // Handle rotation and menu opening
  useEffect(() => {
    let rotationTimer;
    let menuTimer;

    if (isRotating) {
      // For opening: Start showing menu halfway through rotation
      if (actionIntentRef.current === "open" && !isMenuOpen && !isMenuClosing) {
        menuTimer = setTimeout(() => {
          setIsMenuOpen(true);
        }, 500); // Start showing menu after 500ms (halfway through rotation)
      }

      // Complete the rotation after 1 second
      rotationTimer = setTimeout(() => {
        setIsRotating(false);
      }, 1000);
    }

    return () => {
      clearTimeout(rotationTimer);
      clearTimeout(menuTimer);
    };
  }, [isRotating, isMenuOpen, isMenuClosing]);

  // Handle menu closing animation
  useEffect(() => {
    let timer;
    if (isMenuClosing) {
      timer = setTimeout(() => {
        setIsMenuOpen(false);
        setIsMenuClosing(false);
        // Reset the action intent after closing is complete
        actionIntentRef.current = null;
      }, 500); // Match this with the CSS animation duration
    }
    return () => clearTimeout(timer);
  }, [isMenuClosing]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        isMenuOpen &&
        !isMenuClosing &&
        !isRotating &&
        menuRef.current &&
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        // Close menu with rotation when clicking outside
        closeMenuWithRotation();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen, isMenuClosing, isRotating]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.location.href = "/login";
  };

  const handleSavedRoutes = () => {
    // Navigate to saved routes
    console.log("Navigating to saved routes...");
  };

  const handleProfilePage = () => {
    // Navigate to saved routes
    console.log("Navigating to saved routes...");
  };

  return (
    <div className="profile-menu-container">
      {(isMenuOpen || isMenuClosing) && (
        <div
          className={`profile-menu ${
            isMenuClosing ? "menu-closing" : "menu-opening"
          }`}
          ref={menuRef}
        >
          <div className="profile-header">
            <div className="profile-avatar">
              {user.profileImage ? (
                <img
                  src={user.profileImage || "/placeholder.svg"}
                  alt="Profile"
                />
              ) : (
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 63 63"
                  fill="#FF3B10"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle
                    cx="31.5"
                    cy="31.5"
                    r="31.5"
                    fill="#FF3B10"
                    opacity="0.4"
                  />
                  <circle cx="31.5" cy="27.5" r="11.5" fill="white" />
                  <path
                    d="M52.8595 54.6525C47.2525 59.8185 39.7555 63 31.5025 63C23.2495 63 15.7525 59.8185 10.1455 54.6525C10.9015 51.786 12.949 49.1715 15.9415 47.1555C24.541 41.4225 38.527 41.4225 47.0635 47.1555C50.0875 49.1715 52.1035 51.786 52.8595 54.6525Z"
                    fill="white"
                  />
                </svg>
              )}
            </div>
            <div className="profile-name">{user.username}</div>
          </div>
          <div className="menu-divider"></div>
          <ul className="menu-options">
            <li onClick={handleProfilePage}>
              <svg
                width="24"
                height="24"
                transform="translate(5,0)"
                viewBox="0 0 25 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.8125 10.625C15.5729 10.625 17 12.0521 17 13.8125C17 16.1842 16.0247 18.0843 14.4242 19.369C12.849 20.6333 10.7378 21.25 8.5 21.25C6.26221 21.25 4.15102 20.6333 2.57582 19.369C0.975311 18.0843 0 16.1842 0 13.8125C0 12.1557 1.26411 10.7941 2.88048 10.6396L3.18746 10.625H13.8125ZM8.5 0C10.8472 0 12.75 1.90279 12.75 4.25C12.75 6.59721 10.8472 8.5 8.5 8.5C6.15279 8.5 4.25 6.59721 4.25 4.25C4.25 1.90279 6.15279 0 8.5 0Z"
                  fill="#FF3B10"
                />
              </svg>
              <span>Profile</span>
            </li>
            <li onClick={handleSavedRoutes}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 25 25"
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
              <span>Saved Routes</span>
            </li>
            <li onClick={handleLogout}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 25 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M13.5 2.25C19.7134 2.25 24.75 7.28662 24.75 13.5C24.75 19.7134 19.7134 24.75 13.5 24.75C7.28662 24.75 2.25 19.7134 2.25 13.5C2.25 7.28662 7.28662 2.25 13.5 2.25ZM7.875 9L2.25 13.5L7.875 18V14.625H16.875V12.375H7.875L7.875 9Z"
                  fill="#FF3B10"
                />
              </svg>
              <span>Log Out</span>
            </li>
          </ul>
        </div>
      )}
      <button
        className={`profile-button ${
          isRotating
            ? rotationDirection === "clockwise"
              ? "rotate"
              : "rotate-counter"
            : ""
        }`}
        onClick={handleClick}
        aria-label="Profile Menu"
        ref={buttonRef}
      >
        <svg
          width="66"
          height="66"
          viewBox="0 0 66 66"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <rect width="66" height="66" rx="33" fill="white" />
          <path
            d="M44.9216 32.7859C48.8626 32.7859 52.0574 35.9807 52.0574 39.9216C52.0574 45.231 49.874 49.4848 46.291 52.3607C42.7646 55.1912 38.0384 56.5717 33.0287 56.5717C28.019 56.5717 23.2928 55.1912 19.7664 52.3607C16.1834 49.4848 14 45.231 14 39.9216C14 36.2127 16.8299 33.1643 20.4485 32.8185L21.1357 32.7859H44.9216ZM33.0287 9C38.2833 9 42.5431 13.2597 42.5431 18.5143C42.5431 23.769 38.2833 28.0287 33.0287 28.0287C27.7741 28.0287 23.5144 23.769 23.5144 18.5143C23.5144 13.2597 27.7741 9 33.0287 9Z"
            fill="#FF3B10"
          />
        </svg>
      </button>
    </div>
  );
};

export default ProfileMenu;
