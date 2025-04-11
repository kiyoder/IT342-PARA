"use client";

import { useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function LoginForm({ onLoginSuccess }) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8080/api/users/login",
        {
          username: username,
          password: password,
        },
        {
          headers: { "Content-Type": "application/json" },
        }
      );

      console.log("Login successful:", response.data);
      onLoginSuccess(response.data.token);
    } catch (error) {
      console.error("Login failed:", error);
      setError(error.response ? error.response.data : "Login failed");
    }
  };

  return (
    <>
      <h2 className="form-title">Sign-In</h2>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="login-form">
        <div className="form-group">
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className="form-input"
          />
        </div>

        <div className="form-group">
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            required
            className="form-input"
          />
        </div>

        <div className="show-password">
          <input
            type="checkbox"
            id="showPassword"
            checked={showPassword}
            onChange={() => setShowPassword(!showPassword)}
            className="checkbox"
          />
          <label htmlFor="showPassword">Show Password</label>
        </div>

        <button type="submit" className="sign-in-button">
          Sign-In
        </button>
      </form>

      <div className="account-options">
        <Link to="/register" className="create-account-link">
          Create Account
        </Link>
      </div>

      <div className="divider">
        <span className="divider-line"></span>
        <span className="divider-text">or</span>
        <span className="divider-line"></span>
      </div>

      <button type="button" className="google-sign-in">
        <svg
          width="20"
          height="20"
          viewBox="0 0 20 20"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M18.1711 8.36788H17.5V8.33329H10V11.6666H14.6422C13.9272 13.6063 12.1133 15 10 15C7.23859 15 5.00001 12.7614 5.00001 10C5.00001 7.23858 7.23859 5 10 5C11.2558 5 12.4033 5.48797 13.2819 6.27331L15.6069 3.90815C14.0819 2.52197 12.1337 1.66671 10 1.66671C5.39764 1.66671 1.66667 5.39767 1.66667 10C1.66667 14.6024 5.39764 18.3334 10 18.3334C14.6024 18.3334 18.3333 14.6024 18.3333 10C18.3333 9.44117 18.2758 8.89588 18.1711 8.36788Z"
            fill="#FFC107"
          />
          <path
            d="M2.62744 6.12121L5.36078 8.12954C6.10744 6.29454 7.90078 5 10 5C11.2558 5 12.4033 5.48797 13.2819 6.2731L15.6069 3.90815C14.0819 2.52197 12.1337 1.66671 10 1.66671C6.83911 1.66671 4.12578 3.47815 2.62744 6.12121Z"
            fill="#FF3D00"
          />
          <path
            d="M10 18.3333C12.0842 18.3333 13.9883 17.5089 15.4975 16.17L12.9559 13.9856C12.0985 14.6348 11.0654 15 10 15C7.89745 15 6.09051 13.6176 5.37051 11.6895L2.70184 13.7951C4.18301 16.4915 6.9409 18.3333 10 18.3333Z"
            fill="#4CAF50"
          />
          <path
            d="M18.1711 8.36788H17.5V8.33329H10V11.6666H14.6422C14.2941 12.5808 13.7167 13.371 12.9547 13.9867L12.9559 13.9855L15.4975 16.17C15.3142 16.3355 18.3333 14.1666 18.3333 9.99996C18.3333 9.44113 18.2758 8.89584 18.1711 8.36788Z"
            fill="#1976D2"
          />
        </svg>
      </button>
    </>
  );
}

export default LoginForm;
