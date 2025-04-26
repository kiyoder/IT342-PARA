import axios from "axios"

const API_URL = "http://localhost:8080/api"

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
            const response = await api.post("/auth/login", { email, password })
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
    register: async (email, password) => {
        try {
            const response = await api.post("/auth/register", { email, password })
            if (response.data.session) {
                localStorage.setItem("token", response.data.session.access_token)
                localStorage.setItem("user", JSON.stringify(response.data.user))
            }
            return response.data
        } catch (error) {
            throw error.response?.data || { error: "Registration failed" }
        }
    },

    // Get Google OAuth URL
    getGoogleAuthUrl: async () => {
        try {
            const redirectUrl = `${window.location.origin}/auth/callback`
            const response = await api.get(`/auth/oauth/google?redirectUrl=${encodeURIComponent(redirectUrl)}`)
            return response.data.url
        } catch (error) {
            throw error.response?.data || { error: "Failed to get OAuth URL" }
        }
    },

    // Handle OAuth callback
    handleOAuthCallback: async (code) => {
        try {
            const redirectUrl = `${window.location.origin}/auth/callback`
            const response = await api.post("/auth/oauth/callback", null, {
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
}

export default authService
