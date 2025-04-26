"use client"

import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import LoginForm from "./components/LoginForm"
import Register from "./pages/Register"

import Home from "./pages/Home"
import GoogleCallback from "./components/GoogleCallback.jsx";


function App() {
    return (
        <Router>
            <Routes>
                <Route path="/login" element={<LoginForm/>} />
                <Route path="/register" element={<Register/>} />
                <Route path="/google-callback" element={<GoogleCallback/>} />
                <Route path="/" element={<Home/>} />
            </Routes>
        </Router>

    )
}




export default App
