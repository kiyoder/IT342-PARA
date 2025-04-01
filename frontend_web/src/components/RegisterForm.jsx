import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Link } from "react-router-dom";

function RegisterForm({ onRegisterSuccess }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState("");
  const [error, setError] = useState("");
  const [usernameValid, setUsernameValid] = useState(null);
  const [emailValid, setEmailValid] = useState(null);
  const [passwordValid, setPasswordValid] = useState(null);
  const [confirmPasswordValid, setConfirmPasswordValid] = useState(null);
  const [showPasswordPopup, setShowPasswordPopup] = useState(false);

  const passwordTimeoutRef = useRef(null);

  useEffect(() => {
    if (username) {
      checkUsername(username)
          .then(response => {
            setUsernameValid(!response.exists);
          })
          .catch(error => {
            console.error("Failed to check username:", error);
            setUsernameValid(false);
          });
    } else {
      setUsernameValid(null);
    }
  }, [username]);

  useEffect(() => {
    if (email && validateEmail(email)) {
      checkEmail(email)
          .then(response => {
            setEmailValid(!response.exists);
          })
          .catch(error => {
            console.error("Failed to check email:", error);
            setEmailValid(false);
          });
    } else {
      setEmailValid(null);
    }
  }, [email]);

  useEffect(() => {
    // Clear the timeout when the component unmounts
    return () => {
      if (passwordTimeoutRef.current) {
        clearTimeout(passwordTimeoutRef.current);
      }
    };
  }, []);

  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUsername = (username) => {
    return username.length > 0;
  };

  const validatePassword = (password) => {
    return checkPasswordStrength(password) === "Strong";
  };

  const handlePasswordChange = (e) => {
    const newPassword = e.target.value;
    setPassword(newPassword);
    setPasswordStrength(checkPasswordStrength(newPassword));
    // Re-validate confirm password when password changes
    setConfirmPasswordValid(
      newPassword === confirmPassword && confirmPassword !== ""
    );
  };

  const handlePasswordFocus = () => {
    passwordTimeoutRef.current = setTimeout(() => {
      setShowPasswordPopup(true);
    }, 500); // Reduced from 4000ms to 500ms for better UX
  };

  const handlePasswordBlur = () => {
    setShowPasswordPopup(false);
    if (passwordTimeoutRef.current) {
      clearTimeout(passwordTimeoutRef.current);
    }
  };

  const handleConfirmPasswordChange = (e) => {
    const newConfirmPassword = e.target.value;
    setConfirmPassword(newConfirmPassword);
    setConfirmPasswordValid(
      newConfirmPassword === password && newConfirmPassword !== ""
    );
  };

  const checkPasswordStrength = (password) => {
    let strength = "Weak";
    const regexes = [/[a-z]/, /[A-Z]/, /\d/, /[!,.@#$%^&+=]/];
    let passed = 0;
    regexes.forEach((regex) => {
      if (regex.test(password)) passed++;
    });
    if (password.length >= 8 && passed >= 3) strength = "Medium";
    if (password.length >= 8 && passed === 4) strength = "Strong";
    setPasswordValid(strength === "Strong");
    return strength;
  };

  const getBarColor = (strength, index) => {
    if (
      strength === "Strong" ||
      (strength === "Medium" && index < 2) ||
      (strength === "Weak" && index < 1)
    ) {
      if (strength === "Strong") return "green";
      if (strength === "Medium") return "orange";
      if (strength === "Weak") return "red";
    }
    return "lightgray";
  };

  const checkUsername = async (username) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/users/check-username?username=${username}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to check username:", error);
      return { exists: false}
    }
  };

  const checkEmail = async (email) => {
    try {
      const response = await axios.get(
        `http://localhost:8080/api/users/check-email?email=${email}`
      );
      return response.data;
    } catch (error) {
      console.error("Failed to check email:", error);
      return { exists: false}
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateUsername(username) || !usernameValid) {
      setError("Invalid or existing username");
      return;
    }
    if (!validateEmail(email) || !emailValid) {
      setError("Invalid or existing email");
      return;
    }
    if (!validatePassword(password)) {
      setError("Password must be strong");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    try {
      const response = await axios.post(
        "http://localhost:8080/api/users/register",
        {
          username,
          email,
          password,
          name,
        }
      );
      console.log("Registration successful:", response.data);
      // Use the onRegisterSuccess prop instead of directly navigating
      if (response.data && response.data.token) {
        onRegisterSuccess(response.data.token);
      } else {
        // If no token is returned, still call onRegisterSuccess with null
        // This allows the parent component to handle navigation to login
        onRegisterSuccess(null);
      }
    } catch (error) {
      console.error("Registration failed:", error);
      setError(error.response ? error.response.data : "Registration failed");
    }
  };

  const renderCriteria = (criteria, isMet) => (
    <li>
      {isMet ? (
        <span className="check-mark">✓</span>
      ) : (
        <span className="x-mark">✗</span>
      )}{" "}
      {criteria}
    </li>
  );

  // Check if password meets specific criteria
  const hasLowerCase = /[a-z]/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSpecialChar = /[!,.@#$%^&+=]/.test(password);
  const hasMinLength = password.length >= 8;

  return (
    <>
      <h2 className="form-title">Create Account</h2>

      {error && <p className="error-message">{error}</p>}

      <form onSubmit={handleSubmit} className="register-form">
        <div className="form-group">
          <input
            id="username"
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Username"
            required
            className={`form-input ${
              usernameValid === true
                ? "valid-input"
                : usernameValid === false
                ? "invalid-input"
                : ""
            }`}
          />
          {usernameValid === false && (
            <div className="validation-message error">
              Username already exists
            </div>
          )}
        </div>

        <div className="form-group">
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            required
            className={`form-input ${
              emailValid === true
                ? "valid-input"
                : emailValid === false
                ? "invalid-input"
                : ""
            }`}
          />
          {emailValid === false && (
            <div className="validation-message error">Email already exists</div>
          )}
        </div>

        <div className="form-group" style={{ position: "relative" }}>
          <input
            id="password"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={handlePasswordChange}
            onFocus={handlePasswordFocus}
            onBlur={handlePasswordBlur}
            placeholder="Password"
            required
            className="form-input"
          />

          {password && (
            <>
              <div className="progress-bar">
                <div
                  className="progress-segment"
                  style={{ backgroundColor: getBarColor(passwordStrength, 0) }}
                ></div>
                <div
                  className="progress-segment"
                  style={{ backgroundColor: getBarColor(passwordStrength, 1) }}
                ></div>
                <div
                  className="progress-segment"
                  style={{ backgroundColor: getBarColor(passwordStrength, 2) }}
                ></div>
              </div>
              <div className="password-strength-text">
                <span
                  style={{
                    color:
                      passwordStrength === "Strong"
                        ? "green"
                        : passwordStrength === "Medium"
                        ? "orange"
                        : "red",
                  }}
                >
                  {passwordStrength}
                </span>
              </div>
            </>
          )}

          {showPasswordPopup && (
            <div className="password-popup">
              <p>Password must contain:</p>
              <ul>
                {renderCriteria("At least 8 characters", hasMinLength)}
                {renderCriteria("One lowercase letter", hasLowerCase)}
                {renderCriteria("One uppercase letter", hasUpperCase)}
                {renderCriteria("One number", hasNumber)}
                {renderCriteria("One special character", hasSpecialChar)}
              </ul>
            </div>
          )}
        </div>

        <div className="form-group">
          <input
            id="confirmPassword"
            type={showPassword ? "text" : "password"}
            value={confirmPassword}
            onChange={handleConfirmPasswordChange}
            placeholder="Confirm Password"
            required
            className={`form-input ${
              confirmPasswordValid === true
                ? "valid-input"
                : confirmPasswordValid === false
                ? "invalid-input"
                : ""
            }`}
          />
          {confirmPasswordValid === false && (
            <div className="validation-message error">
              Passwords do not match
            </div>
          )}
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

        <button
          type="submit"
          className="register-button"
          disabled={
            !usernameValid ||
            !emailValid ||
            !passwordValid ||
            !confirmPasswordValid
          }
        >
          Create Account
        </button>
      </form>

      <div className="account-options">
        <span>Already have an account?</span>
        <Link to="/login" className="login-link">
          Sign In
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

export default RegisterForm;
