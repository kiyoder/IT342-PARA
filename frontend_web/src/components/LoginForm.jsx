// components/LoginForm.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import "../styles/Login.css";

const supabase = createClient(
    'https://lqeeloeqlznjgkkjejpu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZWVsb2VxbHpuamdra2planB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxODY3MzMsImV4cCI6MjA1OTc2MjczM30.x2ywW2R20yE6vFEdZ5-X0Ueqs5htUiUYUALf-cNOH5E'
);

function LoginForm({ onLoginSuccess }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    try {
      setIsLoading(true);

      // Submit login data to backend
      const response = await axios.post('http://localhost:8080/api/auth/login', {
        email,
        password
      });

      console.log("Login response:", response.data);

      // Check if we received a token
      if (response.data.accessToken) {
        // Store token
        localStorage.setItem("token", response.data.accessToken);

        // Get user profile
        const profileResponse = await axios.get('http://localhost:8080/api/users/profile', {
          headers: {
            Authorization: `Bearer ${response.data.accessToken}`,
            "Content-Type": "application/json"
          }
        });

        // Store user data
        localStorage.setItem("username", profileResponse.data.username || "");
        localStorage.setItem("email", profileResponse.data.email || "");

        // Call the success callback if provided
        if (onLoginSuccess) {
          onLoginSuccess(response.data.accessToken);
        }

        // Navigate to profile page
        navigate("/profile");
      } else {
        throw new Error("No access token received from server");
      }
    } catch (error) {
      console.error("Login error:", error);

      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Login failed. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In Handler (same as RegisterForm)
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError("");

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + '/google-callback'
        }
      });

      if (signInError) {
        throw signInError;
      }

    } catch (error) {
      console.error("Google sign-in error:", error);
      setError("Failed to initiate Google sign-in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
      <>
        <h2 className="form-title">Log in to your account</h2>
        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <input
                type="email"
                placeholder="Email"
                className="form-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
          </div>

          <div className="form-group">
            <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="form-input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
            />
          </div>

          <div className="show-password">
            <input
                type="checkbox"
                className="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
            />
            <label>Show Password</label>
          </div>

          <button type="submit" className="login-button" disabled={isLoading}>
            {isLoading ? "Processing..." : "Log In"}
          </button>

          <div className="account-options">
            <span>Don't have an account?</span>
            <Link to="/register" className="register-link">
              Register
            </Link>
          </div>

          <div className="divider">
            <div className="divider-line"></div>
            <div className="divider-text">OR</div>
            <div className="divider-line"></div>
          </div>

          <button
              type="button"
              className="google-sign-in"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
          >
            {isLoading ? "Redirecting..." : "Log in with Google"}
          </button>
        </form>
      </>
  );
}

export default LoginForm;