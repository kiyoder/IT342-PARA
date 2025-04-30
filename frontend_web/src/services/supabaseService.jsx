"use client";

import { useState } from "react";
import axios from "axios";
import { supabase } from "./supabaseClient";

class BackendUserService {
  constructor() {
    this.api = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL + "/api/users",
      headers: {
        "Content-Type": "application/json",
      },
    });
  }

  // Attach the current access token from Supabase session
  async _attachAuthHeader() {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    if (!session) throw new Error("Not authenticated");
    this.api.defaults.headers.common[
      "Authorization"
    ] = `Bearer ${session.access_token}`;
  }

  async getProfile() {
    await this._attachAuthHeader();
    try {
      const response = await this.api.get("/profile");
      return response.data;
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      throw error;
    }
  }

  async updateProfile(updates) {
    await this._attachAuthHeader();
    try {
      const response = await this.api.patch("/profile", updates);
      return response.data;
    } catch (error) {
      console.error("Failed to update profile:", error);
      throw error;
    }
  }

  async checkUserExists(supabaseUid) {
    await this._attachAuthHeader();
    try {
      const response = await this.api.get(
        `/check-user?supabaseUid=${supabaseUid}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to check user:", error);
      throw error;
    }
  }
}

// React Hook Wrapper
export function useUserService() {
  const [service] = useState(() => new BackendUserService());
  return service;
}

// Singleton instance
const userService = new BackendUserService();
export default userService;
