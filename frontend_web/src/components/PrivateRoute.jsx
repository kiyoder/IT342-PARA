"use client"

import { useAuth } from "../context/AuthContext"
import { Navigate } from "react-router-dom"
import {useEffect, useState} from "react";

export default function PrivateRoute({ children }) {
    const { user, loading } = useAuth()
    const [isChecking, setIsChecking] = useState(true)
    const [hasToken, setHasToken] = useState(false)

    useEffect(() => {
        // Check if there's a token even if user is null
        const token = localStorage.getItem("token")
        setHasToken(!!token)
        setIsChecking(false)
    }, [user])

    if (loading || isChecking) {
        return <div>Loading...</div>
    }
    // Render the protected route
    return user || hasToken ? children : <Navigate to="/profile" replace />
}