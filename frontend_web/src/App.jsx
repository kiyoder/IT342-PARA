import React from "react";
import {BrowserRouter as Router, Navigate, Route, Routes} from "react-router-dom";
import { useEffect } from 'react';
import Register from "./pages/Register";
import Login from "./pages/Login";
import Home from "./pages/Home";
import ErrorBoundary from "./components/ErrorBoundary";
import LoginFailure from "./pages/LoginFailure.jsx";

// New component to handle token processing
const TokenHandler = () => {
    const location = window.location;
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    useEffect(() => {
        if (token) {
            // Store the token in localStorage
            localStorage.setItem('token', token);
            // Clean up the URL by removing the token parameter
            window.history.replaceState({}, document.title, location.pathname);
        }
    }, [token]);

    // Check if user is authenticated
    const isAuthenticated = !!localStorage.getItem('token');

    // If not authenticated, redirect to login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render the Home component
    return <Home />;
};


function App() {

  return (
    <Router>
      <div className="App">
        <Routes>
          <Route
            path="/login"
            element={
              <ErrorBoundary>
                <Login />
              </ErrorBoundary>
            }
          />
          <Route path="/register" element={<Register />} />
          {/*<Route path="/" element={<Home />} />*/}
          {/*<Route path="/home" element={<Home />} />*/}
            <Route path="/" element={<TokenHandler />} />
            <Route path="/home" element={<TokenHandler />} />
            <Route path="/loginFailure" element={<LoginFailure />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
