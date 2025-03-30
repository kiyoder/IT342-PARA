import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false); // State for password visibility
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(
        "http://localhost:8080/api/users/login",
        {
          username: username, // ✅ Ensure field names match LoginRequest.java
          password: password,
        },
        {
          headers: { "Content-Type": "application/json" }, // ✅ Set JSON header
        }
      );

      console.log("Login successful:", response.data);
      localStorage.setItem("token", response.data.token); // ✅ Fix to store token correctly
      navigate("/");
    } catch (error) {
      console.error("Login failed:", error);
      setError(error.response ? error.response.data : "Login failed");
    }
  };

  return (
    <div>
      <h2>Login</h2>
      {error && <p style={{ color: "red" }}>{error}</p>}
      <form onSubmit={handleSubmit}>
        <div>
          <label>Username</label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label>Password</label>
          <input
            type={showPassword ? "text" : "password"} // Toggle input type
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <div>
            <input
              type="checkbox"
              checked={showPassword}
              onChange={() => setShowPassword(!showPassword)}
            />
            <label>Show Password</label>
          </div>
        </div>
        <button type="submit">Login</button>
      </form>
    </div>
  );
}

export default Login;
