// src/services/supabaseService.jsx

import { useState, useEffect } from 'react';

class SupabaseService {
    constructor(baseUrl, apiKey) {
        this.baseUrl = baseUrl;
        this.apiKey = apiKey;
    }

    // Generic request handler
    async _makeRequest(endpoint, method = 'GET', body = null, customHeaders = {}) {
        const headers = {
            'apikey': this.apiKey,
            'Authorization': `Bearer ${this.apiKey}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal',
            ...customHeaders
        };

        try {
            const response = await fetch(`${this.baseUrl}${endpoint}`, {
                method,
                headers,
                body: body ? JSON.stringify(body) : null
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                return await response.json();
            }
            return null;
        } catch (error) {
            console.error('API request failed:', error);
            throw error;
        }
    }

    // User Profile Methods
    async getProfileFromSupabase(supabaseUid) {
        return this._makeRequest(`/rest/v1/profiles?id=eq.${supabaseUid}`);
    }

    async createProfile(uid, username, email, userToken) {
        return this._makeRequest(
            '/rest/v1/profiles',
            'POST',
            { id: uid, username, email },
            { Authorization: `Bearer ${userToken}` }
        );
    }

    async updateProfile(uid, username, userToken) {
        return this._makeRequest(
            `/rest/v1/profiles?id=eq.${uid}`,
            'PATCH',
            { username },
            { Authorization: `Bearer ${userToken}` }
        );
    }

    // Auth Methods
    async signUpWithEmailPassword(email, password) {
        return this._makeRequest(
            '/auth/v1/signup',
            'POST',
            { email, password }
        );
    }

    async loginWithEmailPassword(email, password) {
        return this._makeRequest(
            '/auth/v1/token?grant_type=password',
            'POST',
            { email, password }
        );
    }

    async getUserFromToken(jwt) {
        return this._makeRequest(
            '/auth/v1/user',
            'GET',
            null,
            { Authorization: `Bearer ${jwt}` }
        );
    }
}

// React Hook Wrapper
export function useSupabaseService() {
    const [service] = useState(() => {
        // Get these from your environment/config
        const baseUrl = process.env.REACT_APP_SUPABASE_URL;
        const apiKey = process.env.REACT_APP_SUPABASE_KEY;
        return new SupabaseService(baseUrl, apiKey);
    });

    return service;
}

// Singleton instance
const supabaseService = new SupabaseService(
    process.env.REACT_APP_SUPABASE_URL,
    process.env.REACT_APP_SUPABASE_KEY
);

export default supabaseService;