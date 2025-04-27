/*"use client";

import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { useAuth } from "../../context/AuthContext";

const ProfileMenu = () => {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function getProfile() {
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("username")
          .eq("id", user.id)
          .single();

        if (error) {
          console.error("Error loading profile data:", error);
          setError("Could not load profile data. Please try again later.");
        } else if (data) {
          setProfile(data);
        }
      } catch (error) {
        console.error("Exception loading profile data:", error);
        setError("An unexpected error occurred. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    getProfile();
  }, [user]);

  const handleLogout = async () => {
    try {
      await signOut();
      // Navigation is handled by the AuthContext
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };

  // IMPORTANT: Don't redirect to login here - let the auth context handle it
  if (!user) {
    return null; // Don't render anything if not logged in
  }

  return (
    <div>
      {loading ? (
        <p>Loading profile...</p>
      ) : error ? (
        <p className="text-red-500">{error}</p>
      ) : profile ? (
        <p>Welcome, {profile.username}!</p>
      ) : (
        <p>Welcome!</p>
      )}
      <button
        onClick={handleLogout}
        className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
      >
        Logout
      </button>
    </div>
  );
};

export default ProfileMenu;
*/
