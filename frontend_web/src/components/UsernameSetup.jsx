"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { profileService } from "../services/profileService"

export default function UsernameSetup() {
    const { user } = useAuth()
    const [username, setUsername] = useState("")
    const [submitting, setSubmitting] = useState(false)
    const [error, setError] = useState(null)
    const [existingUsername, setExistingUsername] = useState(null)
    const [checkingExisting, setCheckingExisting] = useState(true)
    const navigate = useNavigate()

    // Check if user already has a username
    useEffect(() => {
        let isMounted = true

        async function checkExistingUsername() {
            if (!user) return

            try {
                setCheckingExisting(true)
                console.log("Checking if user has existing username")
                const profile = await profileService.getProfile(user.id)

                if (profile && profile.username) {
                    console.log("User already has username:", profile.username)
                    if (isMounted) {
                        setExistingUsername(profile.username)
                        // If they already have a username, redirect to home
                        navigate("/")
                    }
                } else {
                    console.log("User does not have a username yet")
                }
            } catch (error) {
                console.error("Exception checking existing username:", error)
                if (isMounted) setError("Network error: " + (error.message || "Unknown error"))
            } finally {
                if (isMounted) setCheckingExisting(false)
            }
        }

        checkExistingUsername()

        return () => {
            isMounted = false
        }
    }, [user, navigate])

    const handleSubmit = async (e) => {
        e.preventDefault()

        if (!username.trim()) {
            setError("Username cannot be empty")
            return
        }

        try {
            setSubmitting(true)
            setError(null)

            console.log("Setting username:", username)

            // Update profile with username
            await profileService.updateProfile(user.id, {
                id: user.id,
                username,
                updated_at: new Date().toISOString(),
            })

            console.log("Username set successfully")

            // Redirect to home page
            navigate("/")
        } catch (error) {
            console.error("Error setting username:", error)
            setError(error.message || "An unexpected error occurred")
        } finally {
            setSubmitting(false)
        }
    }

    if (checkingExisting) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-gray-600">Checking profile...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Welcome to PARA</h1>
                    <p className="mt-2 text-gray-600">Please set up your username to continue</p>
                </div>

                {error && (
                    <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">
                        <p className="font-medium">Error:</p>
                        <p>{error}</p>
                        {error.includes("Network") && (
                            <p className="mt-2 text-xs">
                                This could be due to a network issue or a browser extension interfering with the connection.
                            </p>
                        )}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <div>
                        <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            id="username"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                            className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>

                    <div>
                        <button
                            type="submit"
                            disabled={submitting}
                            className="flex justify-center w-full px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            {submitting ? "Setting up..." : "Continue"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}
