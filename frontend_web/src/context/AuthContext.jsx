"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { authService } from "../services/authService"
import userService from "../services/supabaseService.jsx";

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [profile, setProfile] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    useEffect(() => {
        const checkSession = async () => {
            try {
                setLoading(true);
                const token = localStorage.getItem("token");
                if (token) {
                    const userData = await authService.getUserFromToken(token);
                    if (userData) {
                        setUser({
                            id: userData.id,
                            email: userData.email,
                            username: userData.username
                        });
                        await loadUserProfile(token);
                    }
                }
            } catch (error) {
                console.error("Session check failed:", error);
                authService.logout();
            } finally {
                setLoading(false);
            }
        };
        checkSession();
    }, []);

    const loadUserProfile = async (token) => {
        try {
            const profileData = await userService.getProfile(token)
            setProfile(profileData)
        } catch (error) {
            console.error("Profile load failed:", error)
            setError(error)
            return null

        }
    }

    const signOut = () => {
        authService.logout()
        localStorage.removeItem("token") // Ensure token is removed
        setUser(null)
        setProfile(null)
    }

    const value = {
        user,
        profile,
        loading,
        error,
        signIn: async (email, password) => {
            try {
                const response = await authService.login(email, password)
                localStorage.setItem("token", response.accessToken) // Store token
                const userData = await authService.getUserFromToken(response.accessToken)
                setUser(userData)
                await loadUserProfile(response.token)
                return response
            } catch (error) {
                setError(error)
                throw error
            }
        },
        signUp: async (email, password, username) => {
            try {
                const response = await authService.register(email, password,username);
                localStorage.setItem("token", response.session.access_token);
                const userData = {
                    id: response.user.id,
                    email: response.user.email,
                    username: response.user.username
                };
                setUser(userData);
                await loadUserProfile(response.session.access_token);
                return response;
            } catch (error) {
                setError(error);
                throw error;
            }
        },
        signOut,
        refreshProfile: async () => {
            const token = localStorage.getItem("token")
            if (token) {
                return await loadUserProfile(token)
            }
            return null
        },
        updateProfile: async (updates) => {
            const token = localStorage.getItem("token")
            if (!token) return null

            try {
                const updatedProfile = await userService.updateProfile(token, updates)
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