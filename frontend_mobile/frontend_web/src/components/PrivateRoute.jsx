"use client";

import { useAuth } from "../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);
  const [hasToken, setHasToken] = useState(false);

  useEffect(() => {
    // Check if there's a valid token in localStorage
    const token = localStorage.getItem("token");
    setHasToken(!!token); // Ensure hasToken is cleared if the token is missing
    setIsChecking(false);
  }, []);

  if (loading || isChecking) {
    console.log("Checking authentication...");
    return <div>Loading...</div>;
  }

  // console.log("User:", user);
  // console.log("Token in localStorage:", localStorage.getItem("token"));
  // console.log("Has Token:", hasToken);

  // Redirect to login if not authenticated
  return user && hasToken ? children : <Navigate to="/login" replace />;
}
