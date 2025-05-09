"use client";

import { useAuth } from "../../contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";

export default function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Set a small delay to allow auth state to settle
    const timer = setTimeout(() => {
      setIsChecking(false);
    }, 100);

    return () => clearTimeout(timer);
  }, []);

  if (loading || isChecking) {
    return <div>Loading...</div>;
  }

  return user ? children : <Navigate to="/login" replace />;
}
