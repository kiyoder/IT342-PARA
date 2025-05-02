"use client"

import { useState } from 'react';
import axios from 'axios';

class BackendUserService {
    constructor() {
        this.api = axios.create({
            baseURL: '/api/users', // Uses relative path to your backend
            headers: {
                'Content-Type': 'application/json'
            }
        });
    }

    // Add auth token to requests
    _setAuthHeader(token) {
        this.api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    }

    async getProfile(token) {
        this._setAuthHeader(token);
        try {
            const response = await this.api.get('/profile');
            return response.data;
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            throw error;
        }
    }

    async updateProfile(token, updates) {
        this._setAuthHeader(token);
        try {
            const response = await this.api.patch('/profile', updates);
            return response.data;
        } catch (error) {
            console.error('Failed to update profile:', error);
            throw error;
        }
    }

    async checkUserExists(token, supabaseUid) {
        this._setAuthHeader(token);
        try {
            const response = await this.api.get(`/check-user?supabaseUid=${supabaseUid}`);
            return response.data;
        } catch (error) {
            console.error('Failed to check user:', error);
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