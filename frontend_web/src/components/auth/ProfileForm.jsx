"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import styles from "../styles/Profile.css";

const ProfileForm = () => {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Fetch profile data from Spring Boot backend
  useEffect(() => {
    const fetchProfile = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        console.log("No token found, redirecting to login");
        window.location.href = "/login";
        return;
      }

      try {
        console.log(
          "Fetching profile with token:",
          token.substring(0, 15) + "..."
        );

        const response = await axios.get(
          `${import.meta.env.VITE_API_BASE_URL}/api/users/profile`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          }
        );

        console.log("Profile API response:", response.data);

        if (response.data) {
          setProfile(response.data);
          setUsername(response.data.username || "");

          // Save as backup
          localStorage.setItem("username", response.data.username || "");
          localStorage.setItem("email", response.data.email || "");
        } else {
          throw new Error("No profile data received");
        }
      } catch (err) {
        console.error("Error fetching profile:", err);

        // Try to use locally stored data as fallback
        const localUsername = localStorage.getItem("username");
        const localEmail = localStorage.getItem("email");

        if (localUsername && localEmail) {
          console.log("Using locally stored profile data");
          setProfile({
            username: localUsername,
            email: localEmail,
          });
          setUsername(localUsername);
        } else {
          setError("Failed to load profile. Please try logging in again.");

          // If unauthorized, redirect to login
          if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  // Handle profile update
  const handleUpdateProfile = async () => {
    setLoading(true);
    setError("");

    if (!username.trim()) {
      setError("Username cannot be empty");
      setLoading(false);
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            username: username.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update profile");
      }

      // Update local state
      setProfile((prev) => ({ ...prev, username: username.trim() }));
      setEditMode(false);
      localStorage.setItem("username", username.trim());

      // Show success feedback
      setError(""); // Clear any previous errors
    } catch (error) {
      console.error("Update error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    if (signOut) signOut();
    window.location.href = "/register";
  };

  if (loading && !profile) {
    return (
      <div className={styles.profileCard}>
        <div className={styles.profileHeader}>
          <h1 className={styles.profileTitle}>Loading profile...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.profileCard}>
      <div className={styles.profileHeader}>
        <div className={styles.profileAvatar}>
          {profile?.username?.charAt(0).toUpperCase() || "U"}
        </div>
        <h1 className={styles.profileTitle}>Your Profile</h1>
        {error && <p className={styles.errorMessage}>{error}</p>}
      </div>

      <div>
        {/* Email (read-only) */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Email</label>
          <input
            type="email"
            value={profile?.email || ""}
            readOnly
            className={styles.input}
          />
        </div>

        {/* Username (editable) */}
        <div className={styles.formGroup}>
          <label className={styles.label}>Username</label>
          {editMode ? (
            <>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className={`${styles.input} ${styles.inputEditable}`}
                autoFocus
              />
              <div className={styles.buttonGroup}>
                <button
                  onClick={handleUpdateProfile}
                  disabled={loading}
                  className={`${styles.button} ${styles.primaryButton}`}
                >
                  {loading ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditMode(false);
                    setUsername(profile?.username || "");
                  }}
                  className={`${styles.button} ${styles.secondaryButton}`}
                >
                  Cancel
                </button>
              </div>
            </>
          ) : (
            <>
              <input
                type="text"
                value={profile?.username || "Not set"}
                readOnly
                className={styles.input}
              />
              <div className={styles.buttonGroup}>
                <button
                  onClick={() => setEditMode(true)}
                  className={`${styles.button} ${styles.primaryButton}`}
                >
                  Edit
                </button>
              </div>
            </>
          )}
        </div>

        {/* Sign Out Button */}
        <div className={styles.actionsContainer}>
          <button
            onClick={handleSignOut}
            className={`${styles.button} ${styles.dangerButton} ${styles.fullWidth}`}
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
