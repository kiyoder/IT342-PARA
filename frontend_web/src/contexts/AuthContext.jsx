"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { supabase } from "../services/supabaseClient";
import userService from "../services/supabaseService.jsx";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [session, setSession] = useState(null);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // Load existing session (auto-refresh if expired)
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session) loadUserProfile();
      })
      .catch((err) => console.error("Error loading session:", err))
      .finally(() => setLoading(false));

    // Subscribe to auth state changes
    const { data: subscription } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        if (session) loadUserProfile();
        else setProfile(null);
      }
    );

    return () => subscription.subscription.unsubscribe();
  }, []);

  async function loadUserProfile() {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) return;
      const profileData = await userService.getProfile(session.access_token);
      setProfile(profileData);
    } catch (err) {
      console.error("Profile load failed:", err);
      setError(err);
    }
  }

  const signIn = async (email, password) => {
    setError(null);
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data.session;
  };

  const signUp = async (email, password) => {
    setError(null);
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) throw error;
    return data.session;
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = {
    session,
    user,
    profile,
    loading,
    error,
    signIn,
    signUp,
    signOut,
    refreshProfile: loadUserProfile,
    updateProfile: async (updates) => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) throw new Error("Not authenticated");
        const updatedProfile = await userService.updateProfile(
          session.access_token,
          updates
        );
        setProfile(updatedProfile);
        return updatedProfile;
      } catch (err) {
        console.error("Update profile failed:", err);
        setError(err);
        throw err;
      }
    },
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within an AuthProvider");
  return context;
}
