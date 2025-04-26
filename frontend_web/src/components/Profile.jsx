"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import Navigation from "./Navigation"
import { profileService } from "../services/profileService"

export default function Profile() {
    const { user } = useAuth()
    const [loading, setLoading] = useState(true)
    const [username, setUsername] = useState("")
    const [updating, setUpdating] = useState(false)
    const [error, setError] = useState(null)
    const [message, setMessage] = useState(null)

    useEffect(() => {
        async function getProfile() {
            try {
                setLoading(true)

                if (!user) return

                console.log("Profile: Fetching profile data for user:", user.id)
                const data = await profileService.getProfile(user.id)

                if (data) {
                    console.log("Profile: Found username:", data.username)
                    setUsername(data.username)
                }
            } catch (error) {
                console.error("Profile: Exception loading user data:", error)
                setError("Failed to load profile data. Please try again later.")
            } finally {
                setLoading(false)
            }
        }

        getProfile()
    }, [user])

    async function updateProfile() {
        try {
            setUpdating(true)
            setError(null)
            setMessage(null)

            if (!user) return

            const updates = {
                id: user.id,
                username,
                updated_at: new Date().toISOString(),
            }

            console.log("Profile: Updating profile with data:", updates)
            await profileService.updateProfile(user.id, updates)

            setMessage("Profile updated successfully!")
        } catch (error) {
            console.error("Profile: Exception updating profile:", error)
            setError(error.message)
        } finally {
            setUpdating(false)
        }
    }

    return (
        <div className="min-h-screen bg-gray-100">
            <Navigation />
            <div className="flex flex-col items-center justify-center p-4">
                <div className="w-full max-w-md p-8 mt-8 space-y-8 bg-white rounded-lg shadow-md">
                    <div className="text-center">
                        <h1 className="text-3xl font-bold">Your Profile</h1>
                        <p className="mt-2 text-gray-600">Manage your account information</p>
                    </div>

                    {error && <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                    {message && <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg">{message}</div>}

                    {loading ? (
                        <div className="flex justify-center py-4">
                            <div className="w-8 h-8 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
                        </div>
                    ) : (
                        <div className="mt-8 space-y-6">
                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                    Email
                                </label>
                                <input
                                    id="email"
                                    type="text"
                                    value={user?.email || ""}
                                    disabled
                                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm bg-gray-50"
                                />
                            </div>

                            <div>
                                <label htmlFor="username" className="block text-sm font-medium text-gray-700">
                                    Username
                                </label>
                                <input
                                    id="username"
                                    type="text"
                                    value={username || ""}
                                    onChange={(e) => setUsername(e.target.value)}
                                    className="block w-full px-3 py-2 mt-1 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                                />
                            </div>

                            <div className="flex space-x-4">
                                <button
                                    onClick={updateProfile}
                                    disabled={loading || updating}
                                    className="flex-1 px-4 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md shadow-sm hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    {updating ? "Updating..." : "Update Profile"}
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
