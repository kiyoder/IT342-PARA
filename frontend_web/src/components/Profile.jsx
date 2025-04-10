"use client"

import { useState, useEffect } from "react"
import { supabase } from "../supabaseClient"
import { useAuth } from "../context/AuthContext"

export default function Profile() {
    const { user, signOut } = useAuth()
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

                const { data, error } = await supabase.from("profiles").select("username").eq("id", user.id).single()

                if (error) {
                    throw error
                }

                if (data) {
                    setUsername(data.username)
                }
            } catch (error) {
                console.error("Error loading user data:", error.message)
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

            const { error } = await supabase.from("profiles").upsert(updates)

            if (error) {
                throw error
            }

            setMessage("Profile updated successfully!")
        } catch (error) {
            setError(error.message)
        } finally {
            setUpdating(false)
        }
    }

    return (
        <div className="flex flex-col items-center justify-center min-h-screen p-4 bg-gray-100">
            <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-lg shadow-md">
                <div className="text-center">
                    <h1 className="text-3xl font-bold">Your Profile</h1>
                    <p className="mt-2 text-gray-600">Manage your account information</p>
                </div>

                {error && <div className="p-4 text-sm text-red-700 bg-red-100 rounded-lg">{error}</div>}

                {message && <div className="p-4 text-sm text-green-700 bg-green-100 rounded-lg">{message}</div>}

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

                        <button
                            onClick={signOut}
                            className="flex-1 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        >
                            Sign Out
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}
