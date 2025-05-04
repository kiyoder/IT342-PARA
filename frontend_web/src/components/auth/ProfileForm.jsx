"use client";

import { useState, useEffect } from "react";
import { useAuth } from "../../contexts/AuthContext";
import axios from "axios";
import "../../styles/ProfileForm.css";

const ProfileForm = () => {
  const { signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    username: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
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

  // Handle profile update
  const handleUpdateProfile = async () => {
    // Reset messages
    setError("");
    setSuccess("");

    // Validate
    if (!formData.username.trim()) {
      setError("Username cannot be empty");
      return;
    }

    // Validate password if changing
    if (
      formData.currentPassword ||
      formData.newPassword ||
      formData.confirmPassword
    ) {
      if (!formData.currentPassword) {
        setError("Current password is required");
        return;
      }

      if (!formData.newPassword) {
        setError("New password is required");
        return;
      }

      if (formData.newPassword.length < 6) {
        setError("Password must be at least 6 characters");
        return;
      }

      if (formData.newPassword !== formData.confirmPassword) {
        setError("Passwords do not match");
        return;
      }
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        window.location.href = "/login";
        return;
      }

      // Update profile data
      const updateData = {
        username: formData.username.trim(),
      };

      // Add password data if changing password
      if (formData.currentPassword && formData.newPassword) {
        updateData.currentPassword = formData.currentPassword;
        updateData.newPassword = formData.newPassword;
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/users/profile`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updateData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || `Failed to update profile: ${response.status}`
        );
      }

      // Update local state
      setProfile((prev) => ({ ...prev, username: formData.username.trim() }));
      localStorage.setItem("username", formData.username.trim());

      // Clear password fields
      setFormData((prev) => ({
        ...prev,
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      }));

      setEditMode(false);
      setSuccess("Profile updated successfully");
    } catch (error) {
      console.error("Update error:", error);
      setError(error.message || "Failed to update profile");
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
      <div className="profile-card">
        <div className="profile-title-header">
          <div className="profile-avatar">...</div>
          <h1 className="profile-title">Loading profile...</h1>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-card">
      <div className="profile-title-header">
        <div className="profile-avatar">
          {profile?.username?.charAt(0).toUpperCase() || "U"}
        </div>
        <h1 className="profile-title">Your Profile</h1>
        <p className="profile-subtitle">Manage your account information</p>
      </div>

      <div className="profile-form-section">
        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        {!editMode ? (
          <>
            {/* Read-only view */}
            <div className="profile-form-group">
              <label className="profile-form-label">Email</label>
              <input
                type="email"
                value={profile?.email || ""}
                readOnly
                className="profile-form-input"
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">Username</label>
              <input
                type="text"
                value={profile?.username || "Not set"}
                readOnly
                className="profile-form-input"
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">Password</label>
              <input
                type="password"
                value="••••••••"
                readOnly
                className="profile-form-input"
              />
            </div>

            <button
              onClick={() => setEditMode(true)}
              className="profile-btn btn-primary"
            >
              Edit Profile
            </button>
          </>
        ) : (
          <>
            {/* Edit mode */}
            <div className="profile-form-group">
              <label className="profile-form-label">Email</label>
              <input
                type="email"
                value={profile?.email || ""}
                readOnly
                className="profile-form-input"
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">Username</label>
              <input
                type="text"
                name="username"
                value={formData.username}
                onChange={handleChange}
                className="profile-form-input input-editable"
              />
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">Current Password</label>
              <div className="profile-password-input-wrapper">
                <input
                  type={showPassword.current ? "text" : "password"}
                  name="currentPassword"
                  value={formData.currentPassword}
                  onChange={handleChange}
                  className="profile-form-input input-editable"
                  placeholder="Enter current password to change"
                />
                <button
                  type="button"
                  className="profile-password-toggle-btn"
                  onClick={() => togglePasswordVisibility("current")}
                >
                  {showPassword.current ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">New Password</label>
              <div className="profile-password-input-wrapper">
                <input
                  type={showPassword.new ? "text" : "password"}
                  name="newPassword"
                  value={formData.newPassword}
                  onChange={handleChange}
                  className="profile-form-input input-editable"
                  placeholder="Enter new password"
                />
                <button
                  type="button"
                  className="profile-password-toggle-btn"
                  onClick={() => togglePasswordVisibility("new")}
                >
                  {showPassword.new ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="profile-form-group">
              <label className="profile-form-label">Confirm New Password</label>
              <div className="profile-password-input-wrapper">
                <input
                  type={showPassword.confirm ? "text" : "password"}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className="profile-form-input input-editable"
                  placeholder="Confirm new password"
                />
                <button
                  type="button"
                  className="profile-password-toggle-btn"
                  onClick={() => togglePasswordVisibility("confirm")}
                >
                  {showPassword.confirm ? "Hide" : "Show"}
                </button>
              </div>
            </div>

            <div className="button-group">
              <button
                onClick={handleUpdateProfile}
                disabled={loading}
                className="profile-btn btn-primary"
              >
                {loading ? "Saving..." : "Save Changes"}
              </button>
              <button
                onClick={() => {
                  setEditMode(false);
                  setFormData((prev) => ({
                    ...prev,
                    username: profile?.username || "",
                    currentPassword: "",
                    newPassword: "",
                    confirmPassword: "",
                  }));
                  setError("");
                }}
                className="profile-btn btn-secondary"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </div>

      <div className="sign-out-button">
        <button
          onClick={handleSignOut}
          className="profile-btn btn-danger btn-full-width"
        >
          Sign Out
        </button>
      </div>
    </div>
  );
};

export default ProfileForm;
