import axios from "axios"

const API_URL = import.meta.env.VITE_API_BASE_URL || "https://para-monorepo-c523fc091002.herokuapp.com";

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token")
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    }
)

// Create axios instance with default config
const api = axios.create({
    baseURL: API_URL,
    headers: {
        "Content-Type": "application/json",
    },
})

// Add auth token to requests if available
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem("token")
        if (token) {
            config.headers["Authorization"] = `Bearer ${token}`
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    },
)

// Auth service methods
export const authService = {
    // Login with email and password
    login: async (email, password) => {
        try {
            const response = await api.post("api/auth/login", { email, password })
            if (response.data.session) {
                localStorage.setItem("token", response.data.session.access_token)
                localStorage.setItem("user", JSON.stringify(response.data.user))
            }
            return response.data
        } catch (error) {
            throw error.response?.data || { error: "Login failed" }
        }
    },

    // Register with email and password
    register: async (email, password, username) => {
        try {
            const response = await api.post("api/auth/signup", { email, password, username });
            if (response.data.accessToken) {
                localStorage.setItem("token", response.data.accessToken);
                localStorage.setItem("user", JSON.stringify(response.data.user));
                return {
                    session: {
                        access_token: response.data.accessToken
                    },
                    user: response.data.user
                };
            }
            throw new Error("Registration failed - no token received");
        } catch (error) {
            throw error.response?.data || { error: "Registration failed" };
        }
    },

    // Get Google OAuth URL
    getGoogleAuthUrl: async () => {
        try {
            const redirectUrl = `${window.location.origin}/auth/callback`
            const response = await api.get(`api/auth/oauth/google?redirectUrl=${encodeURIComponent(redirectUrl)}`)
            return response.data.url
        } catch (error) {
            throw error.response?.data || { error: "Failed to get OAuth URL" }
        }
    },

    // Handle OAuth callback
    handleOAuthCallback: async (code) => {
        try {
            const redirectUrl = `${window.location.origin}/auth/callback`
            const response = await api.post("api/auth/oauth/callback", null, {
                params: { code, redirectUrl },
            })

            if (response.data.session) {
                localStorage.setItem("token", response.data.session.access_token)
                localStorage.setItem("user", JSON.stringify(response.data.user))
            }
            return response.data
        } catch (error) {
            throw error.response?.data || { error: "OAuth callback failed" }
        }
    },

    // Logout
    logout: () => {
        localStorage.removeItem("token")
        localStorage.removeItem("user")
    },

    // Get current user
    getCurrentUser: () => {
        const user = localStorage.getItem("user")
        return user ? JSON.parse(user) : null
    },

    // Check if user is authenticated
    isAuthenticated: () => {
        return !!localStorage.getItem("token")
    },

    getUserFromToken: async (token) => {
        try {
            const response = await api.get("api/auth/validate-token", {
                headers: {
                    "Authorization": `Bearer ${token}`
                }
            });
            return response.data.user; // Return the user object directly
        } catch (error) {
            console.error("Token validation failed:", error);
            throw error;
        }
    },
}

export default authService
