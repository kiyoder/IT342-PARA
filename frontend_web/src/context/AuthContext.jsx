"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { authService } from "../services/authService"
import userService from "../services/UserService.jsx"

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const checkSession = async () => {
            try {
                setLoading(true)
                const currentUser = authService.getCurrentUser()
                if (currentUser) {
                    setUser(currentUser)
                    await loadUserProfile(currentUser.token)
                }
            } catch (error) {
                console.error("Session check failed:", error)
                setError(error)
                authService.logout()
            } finally {
                setLoading(false)
            }
        }

        checkSession()
    }, [])

    const loadUserProfile = async (token) => {
        try {
            const profileData = await userService.getProfile(token)
            setProfile(profileData)
        } catch (error) {
            console.error("Profile load failed:", error)
            setError(error)
        }
    }

    const signOut = () => {
        authService.logout()
        setUser(null)
        setProfile(null)
        // Navigation is now handled by components
    }

    const value = {
        user,
        profile,
        loading,
        error,
        signIn: async (email, password) => {
            try {
                const response = await authService.login(email, password)
                setUser(response.user)
                await loadUserProfile(response.token)
                return response
            } catch (error) {
                setError(error)
                throw error
            }
        },
        signUp: async (email, password) => {
            try {
                const response = await authService.register(email, password)
                setUser(response.user)
                return response
            } catch (error) {
                setError(error)
                throw error
            }
        },
        signOut,
        refreshProfile: () => user?.token && loadUserProfile(user.token),
        updateProfile: async (updates) => {
            if (!user?.token) return
            try {
                const updatedProfile = await userService.updateProfile(user.token, updates)
                setProfile(updatedProfile)
                return updatedProfile
            } catch (error) {
                setError(error)
                throw error
            }
        }
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (!context) {
        throw new Error("useAuth must be used within an AuthProvider")
    }
    return context
}