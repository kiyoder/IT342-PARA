import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import "../../styles/Register.css";
import { useAuth } from "../../contexts/AuthContext.jsx";

// Supabase setup
const supabase = createClient(
  "https://lqeeloeqlznjgkkjejpu.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZWVsb2VxbHpuamdra2planB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxODY3MzMsImV4cCI6MjA1OTc2MjczM30.x2ywW2R20yE6vFEdZ5-X0Ueqs5htUiUYUALf-cNOH5E"
);

function RegisterForm({ onRegisterSuccess }) {
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Basic validation
    if (password !== confirmPassword) {
      setError("Passwords don't match");
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    try {
      setIsLoading(true);

      // Submit registration data to backend
      const response = await signUp(email, password, username);

      console.log("Registration response:", response);

      // Check if we received a token

      // Call the success callback if provided
      const accessToken = response?.session?.access_token;
      if (onRegisterSuccess && accessToken) {
        onRegisterSuccess(accessToken);
      }

      // Navigate to profile page
      navigate("/profile");
    } catch (error) {
      console.error("Registration error:", error);

      // Handle different error types
      if (error.response?.data?.error) {
        setError(error.response.data.error);
      } else if (error.message) {
        setError(error.message);
      } else {
        setError("Registration failed. Please try again later.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Google Sign-In Handler
  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError("");

      const { error: signInError } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: window.location.origin + "/google-callback",
        },
      });

      if (signInError) {
        throw signInError;
      }

      // The rest is handled by GoogleCallback component after redirect
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError("Failed to initiate Google sign-in. Please try again.");
      setIsLoading(false);
    }
  };

  return (
    <>
      <h2 className="form-title">Sign up</h2>
      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="register-form">
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
            type="text"
            placeholder="Username"
            className="form-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
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

        <div className="form-group">
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Confirm Password"
            className="form-input"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
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

        <button type="submit" className="register-button" disabled={isLoading}>
          {isLoading ? "Processing..." : "Register"}
        </button>

        <div className="account-options">
          <span>Already have an account?</span>
          <Link to="/login" className="login-link">
            Log in
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
          {isLoading ? "Redirecting..." : "Sign up with Google"}
        </button>
      </form>
    </>
  );
}

export default RegisterForm;
