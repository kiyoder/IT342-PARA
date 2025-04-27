"use client"

import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { AuthProvider } from "./context/AuthContext"
import Register from "./pages/Register"
import Profile from "./components/Profile"
import Home from "./pages/Home"
import GoogleCallback from "./components/GoogleCallback"
import PrivateRoute from "./components/PrivateRoute"
import Login from "./pages/Login";

function App() {
    return (
        <Router>
            <AuthProvider>
                <Routes>
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/google-callback" element={<GoogleCallback />} />
                    <Route path="/profile" element={
                        <PrivateRoute>
                            <Profile />
                        </PrivateRoute>
                    } />
                    <Route path="/" element={<Home />} />
                </Routes>
            </AuthProvider>
        </Router>
    )
}

export default App