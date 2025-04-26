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
            console.log("Adding token to request:", token.substring(0, 10) + "...")
            config.headers["Authorization"] = `Bearer ${token}`
        } else {
            console.warn("No token found in localStorage")
        }
        return config
    },
    (error) => {
        return Promise.reject(error)
    },
)

// Profile service methods
export const profileService = {
    // Get user profile
    getProfile: async (userId) => {
        try {
            console.log("Fetching profile for user ID:", userId)
            const token = localStorage.getItem("token")
            if (!token) {
                console.error("No token available for profile request")
                throw { error: "Authentication required" }
            }

            const response = await api.get(`/profile/${userId}`)
            console.log("Profile response:", response.data)
            return response.data
        } catch (error) {
            console.error("Profile fetch error:", error.response || error)
            throw error.response?.data || { error: "Failed to get profile" }
        }
    },

    // Update user profile
    updateProfile: async (userId, profileData) => {
        try {
            console.log("Updating profile for user ID:", userId, "with data:", profileData)
            const token = localStorage.getItem("token")
            if (!token) {
                console.error("No token available for profile update")
                throw { error: "Authentication required" }
            }

            const response = await api.put(`/profile/${userId}`, profileData)
            console.log("Profile update response:", response.data)
            return response.data
        } catch (error) {
            console.error("Profile update error:", error.response || error)
            throw error.response?.data || { error: "Failed to update profile" }
        }
    },
}

export default profileService
