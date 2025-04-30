// components/LoginForm.jsx
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import "../../styles/Login.css";
import { useAuth } from "../../contexts/AuthContext.jsx";

function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true); // Moved up to reflect loading during auth

    try {
      await signIn(email, password);
      navigate("/profile");
    } catch (error) {
      setError(error.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      setError("");

      const { error: signInError } = await window.supabase.auth.signInWithOAuth(
        {
          provider: "google",
          options: {
            redirectTo: window.location.origin + "/google-callback",
          },
        }
      );

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
