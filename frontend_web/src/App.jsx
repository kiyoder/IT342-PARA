"use client";

import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import Register from "./pages/Register";
import Profile from "./pages/Profile";
import Home from "./pages/Home";
import SavedRoutes from "./pages/SavedRoutes";
import GoogleCallback from "./components/auth/GoogleCallback";
import PrivateRoute from "./components/PrivateRoute"; // Ensures routes are protected
import { RouteProvider } from "./contexts/RouteContext";
import { LocationProvider } from "./contexts/LocationContext";
import Login from "./pages/Login";

function App() {
  return (
    <Router>
      <AuthProvider>
        <RouteProvider>
          <LocationProvider>
            <Routes>
              {/* Public routes */}
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/google-callback" element={<GoogleCallback />} />

              {/* Protected routes */}
              <Route
                path="/profile"
                element={
                  <PrivateRoute>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="/home"
                element={
                  <PrivateRoute>
                    <Home />
                  </PrivateRoute>
                }
              />
              <Route
                path="/saved-routes"
                element={
                  <PrivateRoute>
                    <SavedRoutes />
                  </PrivateRoute>
                }
              />
            </Routes>
          </LocationProvider>
        </RouteProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
