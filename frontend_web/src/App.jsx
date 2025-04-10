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

// Protected route component
function ProtectedRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return <Navigate to="/login" replace />
    }

    return children
}

// Username check route with retry logic
function UsernameCheck({ children }) {
    const { user, loading } = useAuth()
    const [checkingUsername, setCheckingUsername] = useState(true)
    const [hasUsername, setHasUsername] = useState(false)
    const [error, setError] = useState(null)
    const [retryCount, setRetryCount] = useState(0)
    const maxRetries = 3

    useEffect(() => {
        let isMounted = true
        let retryTimeout

        async function checkUsername() {
            if (!user) return

            try {
                console.log(`Checking username for user: ${user.id} (Attempt ${retryCount + 1}/${maxRetries + 1})`)
                const { data, error } = await supabase.from("profiles").select("username").eq("id", user.id).single()

                if (error) {
                    if (error.code === "PGRST116") {
                        // No profile found
                        console.log("No profile found for user")
                        if (isMounted) setHasUsername(false)
                    } else {
                        console.error("Error checking username:", error)

                        // If we haven't exceeded max retries, try again
                        if (retryCount < maxRetries && isMounted) {
                            console.log(`Retrying username check in 1 second (${retryCount + 1}/${maxRetries})`)
                            setRetryCount((prev) => prev + 1)
                            retryTimeout = setTimeout(checkUsername, 1000) // Retry after 1 second
                            return
                        }

                        if (isMounted) setError(error.message)
                    }
                } else if (data && data.username) {
                    console.log("Username found:", data.username)
                    if (isMounted) setHasUsername(true)
                } else {
                    console.log("No username found")
                    if (isMounted) setHasUsername(false)
                }
            } catch (error) {
                console.error("Exception checking username:", error)

                // If we haven't exceeded max retries, try again
                if (retryCount < maxRetries && isMounted) {
                    console.log(`Retrying username check in 1 second (${retryCount + 1}/${maxRetries})`)
                    setRetryCount((prev) => prev + 1)
                    retryTimeout = setTimeout(checkUsername, 1000) // Retry after 1 second
                    return
                }

                if (isMounted) setError(error.message)
            } finally {
                if (isMounted) setCheckingUsername(false)
            }
        }

        if (user) {
            checkUsername()
        } else {
            setCheckingUsername(false)
        }

        return () => {
            isMounted = false
            if (retryTimeout) clearTimeout(retryTimeout)
        }
    }, [user, retryCount])

    // If we're still loading or checking, show a spinner
    if (loading || checkingUsername) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">
                        {checkingUsername ? `Checking profile (Attempt ${retryCount + 1}/${maxRetries + 1})...` : "Loading..."}
                    </p>
                </div>
            </div>
        )
    }

    // If there was an error, show an error message with a retry button
    if (error) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center p-6 bg-white rounded-lg shadow-md max-w-md">
                    <div className="text-red-500 text-5xl mb-4">⚠️</div>
                    <h2 className="text-xl font-semibold mb-2">Connection Error</h2>
                    <p className="text-red-600 mb-4">{error}</p>
                    <p className="text-gray-600 mb-4">
                        There was a problem connecting to the server. This could be due to a network issue or a browser extension
                        interfering with the connection.
                    </p>
                    <div className="flex flex-col space-y-2">
                        <button
                            onClick={() => {
                                setError(null)
                                setCheckingUsername(true)
                                setRetryCount(0)
                            }}
                            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                        >
                            Try Again
                        </button>
                        <button
                            onClick={() => window.location.reload()}
                            className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
                        >
                            Reload Page
                        </button>
                    </div>
                </div>
            </div>
        )
    }

    // If not logged in, redirect to login
    if (!user) {
        return <Navigate to="/login" replace />
    }

    // If no username, redirect to username setup
    if (!hasUsername) {
        return <Navigate to="/setup-username" replace />
    }

    // If all checks pass, render the children
    return children
}

// Public route component - redirects to home if already logged in
function PublicRoute({ children }) {
    const { user, loading } = useAuth()

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
            </div>
        )
    }

    if (user) {
        return <Navigate to="/" replace />
    }

    return children
}

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public routes - redirect to home if logged in */}
                    <Route
                        path="/login"
                        element={
                            <PublicRoute>
                                <LoginForm />
                            </PublicRoute>
                        }
                    />
                    <Route
                        path="/register"
                        element={
                            <PublicRoute>
                                <RegisterForm />
                            </PublicRoute>
                        }
                    />

                    {/* Username setup route - protected but doesn't require username */}
                    <Route
                        path="/setup-username"
                        element={
                            <ProtectedRoute>
                                <UsernameSetup />
                            </ProtectedRoute>
                        }
                    />

                    {/* Protected routes that require username */}
                    <Route
                        path="/"
                        element={
                            <UsernameCheck>
                                <Home />
                            </UsernameCheck>
                        }
                    />
                    <Route
                        path="/profile"
                        element={
                            <UsernameCheck>
                                <Profile />
                            </UsernameCheck>
                        }
                    />

                    {/* Catch-all route */}
                    <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
            </AuthProvider>
        </Router>
    )
}

export default App
