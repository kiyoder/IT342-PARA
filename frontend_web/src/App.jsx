"use client"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import Register from "./pages/Register"
import Profile from "./components/Profile"
import Home from "./pages/Home"
import GoogleCallback from "./components/GoogleCallback"
import PrivateRoute from "./components/PrivateRoute" // Ensures routes are protected
import Login from "./pages/Login";

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    {/* Public routes */}
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/google-callback" element={<GoogleCallback />} />

                    {/* Protected routes */}
                    <Route path="/profile" element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    } />
                    <Route path="/" element={
                        <PrivateRoute>
                            <Home />
                        </PrivateRoute>
                    } />
                </Routes>
            </AuthProvider>
        </Router>
    )
}

export default App