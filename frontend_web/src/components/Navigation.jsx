"use client"

import { Link, useLocation } from "react-router-dom"
import { useAuth } from "../context/AuthContext"

export default function Navigation() {
    const { user, signOut } = useAuth()
    const location = useLocation()

    if (!user) return null

    return (
        <nav className="bg-indigo-600 text-white p-4">
            <div className="container mx-auto flex justify-between items-center">
                <Link to="/" className="text-xl font-bold">
                    PARA
                </Link>
                <div className="flex space-x-4">
                    <Link
                        to="/"
                        className={`px-3 py-2 rounded ${location.pathname === "/" ? "bg-indigo-700" : "hover:bg-indigo-700"}`}
                    >
                        Home
                    </Link>
                    <Link
                        to="/profile"
                        className={`px-3 py-2 rounded ${
                            location.pathname === "/profile" ? "bg-indigo-700" : "hover:bg-indigo-700"
                        }`}
                    >
                        Profile
                    </Link>
                    <button onClick={signOut} className="px-3 py-2 bg-red-500 rounded hover:bg-red-600">
                        Logout
                    </button>
                </div>
            </div>
        </nav>
    )
}
