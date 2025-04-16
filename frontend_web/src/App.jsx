"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import { useAuth } from "./context/AuthContext"
import LoginForm from "./components/LoginForm"
import RegisterForm from "./components/RegisterForm"
import Profile from "./components/Profile"
import Home from "./pages/Home"
import UsernameSetup from "./components/UsernameSetup"
import { useState, useEffect } from "react"
import { supabase } from "./supabaseClient"

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public routes - accessible without auth */}
                    <Route path="/login" element={
                        <PublicOnlyRoute>
                            <LoginForm />
                        </PublicOnlyRoute>
                    } />
                    <Route path="/register" element={
                        <PublicOnlyRoute>
                            <RegisterForm />
                        </PublicOnlyRoute>
                    } />

                    {/* Protected routes - require authentication */}
                    <Route path="/setup-username" element={
                        <ProtectedRoute>
                            <UsernameSetup />
                        </ProtectedRoute>
                    } />
                    <Route path="/" element={
                        <ProtectedRoute>
                            <UsernameCheck>
                                <Home />
                            </UsernameCheck>
                        </ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute>
                            <UsernameCheck>
                                <Profile />
                            </UsernameCheck>
                        </ProtectedRoute>
                    } />

                    {/* Catch-all route */}
                    <Route path="*" element={<Navigate to="/login" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    )
}

// Updated PublicOnlyRoute - only allows access when NOT logged in
function PublicOnlyRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return <LoadingSpinner />
    }

    if (user) {
        return <Navigate to="/" replace />
    }

    return children
}

// Updated ProtectedRoute - requires authentication
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return <LoadingSpinner />
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return children
}

// Simplified UsernameCheck - only checks for username if user exists
function UsernameCheck({ children }) {
    const { user } = useAuth()
    const [hasUsername, setHasUsername] = useState(null)

    useEffect(() => {
        if (!user) return

        const checkUsername = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('username')
                .eq('id', user.id)
                .single()

            setHasUsername(!!data?.username)
        }

        checkUsername()
    }, [user])

    if (hasUsername === null) {
        return <LoadingSpinner />
    }

    if (!hasUsername) {
        return <Navigate to="/setup-username" replace />
    }

    return children
}

// Reusable LoadingSpinner component
function LoadingSpinner() {
    return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
        </div>
    )
}

export default App
