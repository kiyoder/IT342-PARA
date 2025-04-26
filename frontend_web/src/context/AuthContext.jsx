"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { authService } from "../services/authService"

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null) // Add profile state
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()

    // Initial session check and profile load
    useEffect(() => {
        const checkSession = async () => {
            try {
                const currentUser = authService.getCurrentUser()
                if (currentUser) {
                    setUser(currentUser)
                    // Load profile when user is authenticated
                    await loadUserProfile(currentUser.id)
                } else {
                    setUser(null)
                    setProfile(null)
                }
            } catch (error) {
                console.error("Exception getting session:", error)
                setUser(null)
                setProfile(null)
            } finally {
                setLoading(false)
            }
        }

        checkSession()
    }, [])

    const loadUserProfile = async (userId) => {
        try {
            const profileData = await supabaseService.getProfileFromSupabase(userId)
            setProfile(profileData || null)
        } catch (error) {
            console.error("Error loading profile:", error)
            setProfile(null)
        }
    }

    const value = {
        user,
        profile, // Expose profile to consumers
        loading,
        supabaseService, // Expose the service directly
        signIn: async (data) => {
            try {
                const response = await authService.login(data.email, data.password)
                setUser(response.user)
                await loadUserProfile(response.user.id)
                return response
            } catch (error) {
                console.error("Sign in error:", error)
                throw error
            }
        },
        signUp: async (data) => {
            try {
                const response = await authService.register(data.email, data.password)
                setUser(response.user)
                // Optionally create profile here if needed
                return response
            } catch (error) {
                console.error("Sign up error:", error)
                throw error
            }
        },
        signInWithGoogle: async () => {
            try {
                const authUrl = await authService.getGoogleAuthUrl()
                window.location.href = authUrl
            } catch (error) {
                console.error("Google sign-in error:", error)
                throw error
            }
        },
        signOut: async () => {
            authService.logout()
            setUser(null)
            setProfile(null)
            navigate("/login")
        },
        refreshProfile: async () => { // Add method to manually refresh profile
            if (user?.id) {
                await loadUserProfile(user.id)
            }
        },
        getProfile: async () => {
            if (!user) return null;
            return await supabaseService.getProfileFromSupabase(user.id);
        }
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    return useContext(AuthContext)
}