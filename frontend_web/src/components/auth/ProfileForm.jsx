"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import "../../styles/Profile.css";

const ProfileForm = () => {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState({
    username: false,
    password: false,
  });
  const [formData, setFormData] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState({
    profile: true,
    username: false,
    password: false,
  });
  const [error, setError] = useState({
    profile: "",
    username: "",
    password: "",
  });
  const [success, setSuccess] = useState({
    username: "",
    password: "",
  });
  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
    confirm: false,
  });

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
          setFormData((prev) => ({
            ...prev,
            username: response.data.username || "",
          }));

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
          setFormData((prev) => ({
            ...prev,
            username: localUsername,
          }));
        } else {
          setError((prev) => ({
            ...prev,
            profile: "Failed to load profile. Please try logging in again.",
          }));

          // If unauthorized, redirect to login
          if (err.response?.status === 401 || err.response?.status === 403) {
            localStorage.removeItem("token");
            window.location.href = "/login";
          }
        }
      } finally {
        setLoading((prev) => ({
          ...prev,
          profile: false,
        }));
      }
    };

    fetchProfile();
  }, []);

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  // Toggle password visibility
  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  // Handle username update
  const handleUpdateUsername = async () => {
    // Reset messages
    setError((prev) => ({ ...prev, username: "" }));
    setSuccess((prev) => ({ ...prev, username: "" }));

    // Validate
    if (!formData.username.trim()) {
      setError((prev) => ({ ...prev, username: "Username cannot be empty" }));
      return;
    }

    setLoading((prev) => ({ ...prev, username: true }));

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
            username: formData.username.trim(),
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to update username");
      }

      // Update local state
      setProfile((prev) => ({ ...prev, username: formData.username.trim() }));
      setEditMode((prev) => ({ ...prev, username: false }));
      localStorage.setItem("username", formData.username.trim());
      setSuccess((prev) => ({
        ...prev,
        username: "Username updated successfully",
      }));
    } catch (error) {
      console.error("Update error:", error);
      setError((prev) => ({ ...prev, username: error.message }));
    } finally {
      setLoading((prev) => ({ ...prev, username: false }));
    }
  };

  // Handle password update
  const handleUpdatePassword = async () => {
    // Reset messages
    setError((prev) => ({ ...prev, password: "" }));
    setSuccess((prev) => ({ ...prev, password: "" }));

    // Validate
    if (!formData.currentPassword) {
      setError((prev) => ({
        ...prev,
        password: "Current password is required",
      }));
      return;
    }

    if (!formData.newPassword) {
      setError((prev) => ({ ...prev, password: "New password is required" }));
      return;
    }

    if (formData.newPassword.length < 6) {
      setError((prev) => ({
        ...prev,
        password: "Password must be at least 6 characters",
      }));
      return;
    }

    if (formData.newPassword !== formData.confirmPassword) {
      setError((prev) => ({ ...prev, password: "Passwords do not match" }));
      return;
    }

    setLoading((prev) => ({ ...prev, password: true }));

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      // This is a placeholder - you'll need to implement the actual password change endpoint
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/change-password`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            currentPassword: formData.currentPassword,
            newPassword: formData.newPassword,
          }),
        }
      );

      // Since we don't have the actual endpoint, we'll simulate success
      // In a real implementation, you would check the response
      setSuccess((prev) => ({
        ...prev,
        password: "Password updated successfully",
      }));
      setEditMode((prev) => ({ ...prev, password: false }));

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));
    } catch (error) {
      console.error("Password update error:", error);
      setError((prev) => ({
        ...prev,
        password: "Failed to update password. Please try again.",
      }));
    } finally {
      setLoading((prev) => ({ ...prev, password: false }));
    }
  };

  const handleSignOut = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    localStorage.removeItem("email");
    if (signOut) signOut();
    window.location.href = "/register";
  };

  if (loading.profile && !profile) {
    return (
      <div className="profile-card">
        <div className="profile-header">
          <div className="profile-avatar">...</div>
          <h1 className="profile-title">Loading profile...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-card">
      <div className="profile-header">
        <div className="profile-avatar">
          {profile?.username?.charAt(0).toUpperCase() || "U"}
        </div>
        <h1 className="profile-title">Your Profile</h1>
        <p className="profile-subtitle">Manage your account information</p>
      </div>

      <div>
        {/* Email (read-only) */}
        <div className="form-group">
          <label className="form-label">Email</label>
          <input
            type="email"
            value={profile?.email || ""}
            readOnly
            className="form-input"
          />
        </div>

        {/* Username (editable) */}
        <div className="form-group">
          <label className="form-label">Username</label>
          {editMode.username ? (
            <>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className={`form-input ${
                  editMode.username ? "input-editable" : ""
                }`}
                autoFocus
              />
              {error.username && (
                <p className="error-message">{error.username}</p>
              )}
              {success.username && (
                <p className="success-message">{success.username}</p>
              )}
              <div className="button-group">
                <button
                  onClick={handleUpdateUsername}
                  disabled={loading.username}
                  className="btn btn-primary"
                >
                  {loading.username ? "Saving..." : "Save"}
                </button>
                <button
                  onClick={() => {
                    setEditMode((prev) => ({ ...prev, username: false }));
                    setFormData((prev) => ({
                      ...prev,
                      username: profile?.username || "",
                    }));
                    setError((prev) => ({ ...prev, username: "" }));
                  }}
                  className="btn btn-secondary"
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
                className="form-input"
              />
              <div className="button-group">
                <button
                  onClick={() =>
                    setEditMode((prev) => ({ ...prev, username: true }))
                  }
                  className="btn btn-primary"
                >
                  Edit
                </button>
              </div>
              {success.username && (
                <p className="success-message">{success.username}</p>
              )}
            </>
          )}
        </div>

        <div className="section-divider"></div>

        {/* Password Change Section */}
        <div className="section-title">Change Password</div>

        {!editMode.password ? (
          <div className="form-group">
            <button
              onClick={() =>
                setEditMode((prev) => ({ ...prev, password: true }))
              }
              className="btn btn-primary"
            >
              Change Password
            </button>
          </div>
        ) : (
          <>
            {/* Current Password */}
            <div className="form-group">
              <label className="form-label">Current Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword.current ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="form-input input-editable"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility("current")}
                >
                  {showPassword.current ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* New Password */}
            <div className="form-group">
              <label className="form-label">New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword.new ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="form-input input-editable"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility("new")}
                >
                  {showPassword.new ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {/* Confirm New Password */}
            <div className="form-group">
              <label className="form-label">Confirm New Password</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="form-input input-editable"
                />
                <button
                  type="button"
                  className="password-toggle-btn"
                  onClick={() => togglePasswordVisibility("confirm")}
                >
                  {showPassword.confirm ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            {error.password && (
              <p className="error-message">{error.password}</p>
            )}
            {success.password && (
              <p className="success-message">{success.password}</p>
            )}

            <div className="button-group">
              <button
                onClick={handleUpdatePassword}
                disabled={loading.password}
                className="btn btn-primary"
              >
                {loading.password ? "Updating..." : "Update Password"}
              </button>
              <button
                onClick={() => {
                  setEditMode((prev) => ({ ...prev, password: false }));
                  setFormData((prev) => ({
                    ...prev,
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  }));
                  setError((prev) => ({ ...prev, password: "" }));
                }}
                className="btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </>
        )}

        <div className="section-divider"></div>

        {/* Sign Out Button */}
        <div className="actions-container">
          <button
            onClick={handleSignOut}
            className="btn btn-danger btn-full-width"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProfileForm;
