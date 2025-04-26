"use client";

import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import LoginForm from "./components/LoginForm";
import RegisterForm from "./components/RegisterForm";
import Profile from "./components/Profile";
import Home from "./pages/Home";
import UsernameSetup from "./components/UsernameSetup";
import { useState, useEffect } from "react";
import { supabase } from "./supabaseClient";
import { LocationProvider } from "./contexts/LocationContext";
import { RouteProvider } from "./contexts/RouteContext";
import SavedRoutes from "./pages/SavedRoutes";
import ErrorBoundary from "./components/layout/ErrorBoundary";

function App() {
  return (
    <Router>
      <AuthProvider>
        <LocationProvider>
          <RouteProvider>
            <Routes>
              {/* Public routes */}
              <Route
                path="/login"
                element={
                  <PublicOnlyRoute>
                    <LoginForm />
                  </PublicOnlyRoute>
                }
              />
              <Route
                path="/register"
                element={
                  <PublicOnlyRoute>
                    <RegisterForm />
                  </PublicOnlyRoute>
                }
              />

              {/* Username setup */}
              <Route
                path="/setup-username"
                element={
                  <ProtectedRoute>
                    <UsernameSetup />
                  </ProtectedRoute>
                }
              />

              {/* Protected and checked routes */}
              <Route
                path="/"
                element={
                  <ProtectedRoute>
                    <UsernameCheck>
                      <ErrorBoundary>
                        <Home />
                      </ErrorBoundary>
                    </UsernameCheck>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <UsernameCheck>
                      <Profile />
                    </UsernameCheck>
                  </ProtectedRoute>
                }
              />
              <Route
                path="/saved-routes"
                element={
                  <ProtectedRoute>
                    <UsernameCheck>
                      <ErrorBoundary>
                        <SavedRoutes />
                      </ErrorBoundary>
                    </UsernameCheck>
                  </ProtectedRoute>
                }
              />

              {/* Catch-all */}
              <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
          </RouteProvider>
        </LocationProvider>
      </AuthProvider>
    </Router>
  );
}

function PublicOnlyRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (user) return <Navigate to="/" replace />;
  return children;
}

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth();
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;
  return children;
}

function UsernameCheck({ children }) {
  const { user } = useAuth();
  const [hasUsername, setHasUsername] = useState(null);

  useEffect(() => {
    if (!user) return;
    const checkUsername = async () => {
      const { data } = await supabase
        .from("profiles")
        .select("username")
        .eq("id", user.id)
        .single();
      setHasUsername(!!data?.username);
    };
    checkUsername();
  }, [user]);

  if (hasUsername === null) return <LoadingSpinner />;
  if (!hasUsername) return <Navigate to="/setup-username" replace />;
  return children;
}

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="w-16 h-16 border-t-4 border-b-4 border-indigo-500 rounded-full animate-spin"></div>
    </div>
  );
}

export default App;
