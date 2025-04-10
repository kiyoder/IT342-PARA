"use client"

import { createContext, useContext, useState, useEffect } from "react"
import { useNavigate, useLocation } from "react-router-dom"
import { supabase } from "../supabaseClient"

const AuthContext = createContext()

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)
    const navigate = useNavigate()
    const location = useLocation()

    // Initial session check and auth state listener
    useEffect(() => {
        // Check current session
        const checkSession = async () => {
            try {
                const { data, error } = await supabase.auth.getSession()
                if (error) {
                    console.error("Error getting session:", error)
                    setUser(null)
                } else if (data.session) {
                    setUser(data.session.user)
                } else {
                    setUser(null)
                }
            } catch (error) {
                console.error("Exception getting session:", error)
                setUser(null)
            } finally {
                setLoading(false)
            }
        }

        checkSession()

        // Listen for auth changes
        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((event, session) => {
            console.log("Auth state changed:", event)
            if (session) {
                setUser(session.user)
            } else {
                setUser(null)
            }
            setLoading(false)
        })

        return () => {
            subscription?.unsubscribe()
        }
    }, [])

    // IMPORTANT: Remove the navigation logic from here
    // We'll handle navigation in the route components instead

    const value = {
        user,
        loading,
        signIn: (data) => supabase.auth.signInWithPassword(data),
        signUp: (data) => supabase.auth.signUp(data),
        signInWithGoogle: () =>
            supabase.auth.signInWithOAuth({
                provider: "google",
                options: {
                    redirectTo: `${window.location.origin}/`,
                    scopes: "https://www.googleapis.com/auth/userinfo.email", // Important for Google Suite users
                },
            }),
        signOut: async () => {
            await supabase.auth.signOut()
            navigate("/login")
        },
    }

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
    return useContext(AuthContext)
}
