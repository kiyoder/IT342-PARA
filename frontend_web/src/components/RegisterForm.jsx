import { useState } from "react";
import { supabase } from "../supabaseClient";
import PropTypes from "prop-types";

export default function RegisterForm({ onRegisterSuccess }) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Sign up the user with email and password
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
      });

      if (signUpError) throw signUpError;

      console.log("Signup response:", data);

      // Immediately sign in after signup
      const { error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (signInError) throw signInError;

      console.log("Successfully signed in after registration");

      // If onRegisterSuccess prop exists, call it with the session token
      if (onRegisterSuccess && data?.session) {
        onRegisterSuccess(data.session.access_token);
      }

    } catch (error) {
      console.error("Registration error:", error);
      setError(error.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError(null);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`
        }
      });

      if (error) throw error;
      // No need to redirect here as Supabase OAuth will handle redirection
    } catch (error) {
      console.error("Google sign-in error:", error);
      setError(error.message || "Google sign-in failed. Please try again.");
      setLoading(false);
    }
  };

  return (
      <>
        <h2 className="form-title">Create an Account</h2>

        {error && (
            <div className="error-message">
              {error}
            </div>
        )}

        <form onSubmit={handleRegister} className="register-form">
          <div className="form-group">
            <input
                type="email"
                className="form-input"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
            />
          </div>

          <div className="form-group">
            <input
                type={showPassword ? "text" : "password"}
                className="form-input"
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
            />
          </div>

          <div className="show-password">
            <input
                type="checkbox"
                id="showPassword"
                className="checkbox"
                checked={showPassword}
                onChange={() => setShowPassword(!showPassword)}
            />
            <label htmlFor="showPassword">Show password</label>
          </div>

          <button
              type="submit"
              className="sign-up-button"
              disabled={loading}
          >
            {loading ? (
                <span className="loading-spinner">
              <svg className="spinner-icon" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Creating account...
            </span>
            ) : "Sign up"}
          </button>
        </form>

        <div className="account-options">
          <span>Already have an account?</span>
          <a href="/login" className="login-link">Sign in</a>
        </div>

        <div className="divider">
          <div className="divider-line"></div>
          <span className="divider-text">Or continue with</span>
          <div className="divider-line"></div>
        </div>

        <button
            onClick={handleGoogleSignIn}
            className="google-sign-in"
            disabled={loading}
        >
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '10px' }}>
            <path d="M12.0003 4.75C13.7703 4.75 15.3553 5.36 16.6053 6.61L20.0303 3.18C17.9503 1.2 15.2353 0 12.0003 0C7.31033 0 3.25033 2.69 1.27033 6.61L5.27033 9.61C6.29033 6.82 8.91033 4.75 12.0003 4.75Z" fill="#EA4335"/>
            <path d="M23.49 12.27C23.49 11.48 23.41 10.73 23.27 10H12V14.51H18.47C18.17 15.99 17.33 17.25 16.07 18.07L19.93 21.06C22.19 19 23.49 15.92 23.49 12.27Z" fill="#34A853"/>
            <path d="M5.26999 14.39C5.08999 13.63 4.99999 12.84 4.99999 12.01C4.99999 11.17 5.08999 10.39 5.26999 9.64L1.26999 6.64C0.459993 8.27 9.99932e-06 10.08 9.99932e-06 12.01C9.99932e-06 13.94 0.459993 15.75 1.26999 17.38L5.26999 14.39Z" fill="#4A90E2"/>
            <path d="M12.0004 24C15.2404 24 17.9604 22.94 19.9404 21.06L16.0804 18.07C15.0004 18.73 13.6204 19.13 12.0004 19.13C8.91035 19.13 6.29035 17.06 5.27035 14.28L1.27035 17.28C3.25035 21.2 7.31035 24 12.0004 24Z" fill="#FBBC05"/>
          </svg>
          Sign up with Google
        </button>
      </>
  );
}

RegisterForm.propTypes = {
  onRegisterSuccess: PropTypes.func
};