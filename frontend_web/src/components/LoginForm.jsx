"use client"

import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import PropTypes from "prop-types"
import { authService } from "../services/authService"

export default function LoginForm({ onLoginSuccess }) {
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [loginSuccess, setLoginSuccess] = useState(false)
  const navigate = useNavigate()

  // Effect to handle redirection after successful login
  useEffect(() => {
    if (loginSuccess) {
      console.log("Login successful, redirecting to home page")
      navigate("/")
    }
  }, [loginSuccess, navigate])

  // Test API connection (useful for debugging)
  const testApiConnection = async () => {
    try {
      const result = await authService.testConnection()
      console.log("API Connection test:", result)
      alert("API Connection successful: " + JSON.stringify(result))
    } catch (error) {
      console.error("API Connection test failed:", error)
      alert("API Connection failed: " + JSON.stringify(error))
    }
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      console.log("Attempting login with:", email)
      const data = await authService.login(email, password)
      console.log("Login response:", data)

      if (!data) {
        throw new Error("Invalid response from server")
      }

      if (data.error) {
        throw new Error(data.error)
      }

      if (!data.user) {
        throw new Error("No user data returned")
      }

      console.log("Successfully signed in")

      // Store user data even if session is null
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user))
      }

      // If session exists, store the token
      if (data.session && data.session.access_token) {
        localStorage.setItem("token", data.session.access_token)

        // If onLoginSuccess prop exists, call it with the session token
        if (onLoginSuccess) {
          onLoginSuccess(data.session.access_token)
        }
      } else {
        // If no session but we have user, create a temporary token based on user ID
        console.warn("No session token returned, using user ID as fallback")
        const tempToken = `temp_${data.user.id}_${Date.now()}`
        localStorage.setItem("token", tempToken)

        if (onLoginSuccess) {
          onLoginSuccess(tempToken)
        }
      }

      // Set login success state to trigger redirection
      setLoginSuccess(true)
    } catch (error) {
      console.error("Login error:", error)
      setError(error.message || error.error || "Login failed. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  const handleGoogleSignIn = async () => {
    setLoading(true)
    setError(null)

    try {
      const authUrl = await authService.getGoogleAuthUrl()
      window.location.href = authUrl
    } catch (error) {
      console.error("Google sign-in error:", error)
      setError(error.message || error.error || "Google sign-in failed. Please try again.")
      setLoading(false)
    }
  }

  return (
      <>
        <h2 className="form-title">Sign In</h2>

        {error && <div className="error-message">{error}</div>}

        <form onSubmit={handleLogin} className="login-form">
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

          <button type="submit" className="sign-in-button" disabled={loading}>
            {loading ? "Signing in..." : "Sign in"}
          </button>
        </form>

        <div className="account-options">
          <span>Don't have an account?</span>
          <a href="/register" className="create-account-link">
            Create Account
          </a>
        </div>

        <div className="divider">
          <div className="divider-line"></div>
          <span className="divider-text">Or</span>
          <div className="divider-line"></div>
        </div>

        <button onClick={handleGoogleSignIn} className="google-sign-in" disabled={loading}>
          <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ marginRight: "10px" }}
          >
            <path
                d="M21.8055 10.0415H21V10H12V14H17.6515C16.827 16.3285 14.6115 18 12 18C8.6865 18 6 15.3135 6 12C6 8.6865 8.6865 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C6.4775 2 2 6.4775 2 12C2 17.5225 6.4775 22 12 22C17.5225 22 22 17.5225 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
                fill="#FFC107"
            />
            <path
                d="M3.15302 7.3455L6.43852 9.755C7.32752 7.554 9.48052 6 12 6C13.5295 6 14.921 6.577 15.9805 7.5195L18.809 4.691C17.023 3.0265 14.634 2 12 2C8.15902 2 4.82802 4.1685 3.15302 7.3455Z"
                fill="#FF3D00"
            />
            <path
                d="M12 22C14.583 22 16.93 21.0115 18.7045 19.404L15.6095 16.785C14.5718 17.5742 13.3038 18.001 12 18C9.39903 18 7.19053 16.3415 6.35853 14.027L3.09753 16.5395C4.75253 19.778 8.11353 22 12 22Z"
                fill="#4CAF50"
            />
            <path
                d="M21.8055 10.0415H21V10H12V14H17.6515C17.2571 15.1082 16.5467 16.0766 15.608 16.7855L15.6095 16.7845L18.7045 19.4035C18.4855 19.6025 22 17 22 12C22 11.3295 21.931 10.675 21.8055 10.0415Z"
                fill="#1976D2"
            />
          </svg>
          Sign in with Google
        </button>

        {/* Add this button for debugging, but hide in production */}
        {process.env.NODE_ENV !== "production" && (
            <button onClick={testApiConnection} style={{ marginTop: "20px", padding: "5px", fontSize: "12px" }}>
              Test API Connection
            </button>
        )}
      </>
  )
}

LoginForm.propTypes = {
  onLoginSuccess: PropTypes.func,
}
