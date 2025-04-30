"use client";

import { useEffect, useRef, useState } from "react";
import useUserService from "../../services/supabaseService";
import "../../styles/ProfileMenu.css";

const ProfileMenu = () => {
  const [user, setUser] = useState({
    email: null,
    profileImage: null,
  });

  const [isRotating, setIsRotating] = useState(false);
  const [rotationDirection, setRotationDirection] = useState("clockwise");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isMenuClosing, setIsMenuClosing] = useState(false);
  const menuRef = useRef(null);
  const buttonRef = useRef(null);
  const actionIntentRef = useRef(null);

  useEffect(() => {
    const fetchUser = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      try {
        const profile = await useUserService.getProfile(token);
        setUser({
          email: profile.email,
          profileImage: null, // Or set a real image if you have one
        });
      } catch (error) {
        console.error("Error fetching user profile:", error);
        localStorage.clear();
        window.location.href = "/login";
      }
    };

    fetchUser();
  }, []);

  const handleClick = () => {
    if (isMenuOpen && !isMenuClosing) {
      actionIntentRef.current = "close";
    } else if (!isMenuOpen && !isRotating) {
      actionIntentRef.current = "open";
    } else {
      return;
    }

    setIsRotating(true);
    setRotationDirection(isMenuOpen ? "counterclockwise" : "clockwise");

    if (isMenuOpen) {
      setIsMenuClosing(true);
    }
  };

  useEffect(() => {
    let rotationTimer;
    let menuTimer;

    if (isRotating) {
      if (actionIntentRef.current === "open" && !isMenuOpen && !isMenuClosing) {
        menuTimer = setTimeout(() => setIsMenuOpen(true), 500);
      }

      rotationTimer = setTimeout(() => setIsRotating(false), 1000);
    }

    return () => {
      clearTimeout(rotationTimer);
      clearTimeout(menuTimer);
    };
  }, [isRotating]);

  useEffect(() => {
    if (isMenuClosing) {
      const timer = setTimeout(() => {
        setIsMenuOpen(false);
        setIsMenuClosing(false);
        actionIntentRef.current = null;
      }, 500);
      return () => clearTimeout(timer);
    }
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
        closeMenuWithRotation();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMenuOpen, isMenuClosing, isRotating]);

  const closeMenuWithRotation = () => {
    actionIntentRef.current = "close";
    setRotationDirection("counterclockwise");
    setIsRotating(true);
    setIsMenuClosing(true);
  };

  const handleLogout = () => {
    localStorage.clear();
    window.location.href = "/login";
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
                <img src={user.profileImage} alt="Profile" />
              ) : (
                <svg
                  width="40"
                  height="40"
                  viewBox="0 0 63 63"
                  fill="#FF3B10"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <circle cx="31.5" cy="31.5" r="31.5" opacity="0.4" />
                  <circle cx="31.5" cy="27.5" r="11.5" fill="white" />
                  <path
                    d="M52.8595 54.6525C47.2525 59.8185 39.7555 63 31.5025 63C23.2495 63 15.7525 59.8185 10.1455 54.6525C10.9015 51.786 12.949 49.1715 15.9415 47.1555C24.541 41.4225 38.527 41.4225 47.0635 47.1555C50.0875 49.1715 52.1035 51.786 52.8595 54.6525Z"
                    fill="white"
                  />
                </svg>
              )}
            </div>
            <div className="profile-name">{user.email}</div>
          </div>
          <div className="menu-divider"></div>
          <ul className="menu-options">
            <li onClick={() => (window.location.href = "/home")}>
              <span>Home</span>
            </li>
            <li onClick={() => (window.location.href = "/profile")}>
              <span>Profile</span>
            </li>
            <li onClick={() => (window.location.href = "/saved-routes")}>
              <span>Saved Routes</span>
            </li>
            <li onClick={handleLogout}>
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
        {/* SVG or icon button content */}
      </button>
    </div>
  );
};

export default ProfileMenu;
