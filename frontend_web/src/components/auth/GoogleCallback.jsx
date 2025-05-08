import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import "../../styles/GoogleCallback.css";
import {useAuth} from "../../contexts/AuthContext.jsx";

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

function GoogleCallback() {
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [showUsernameForm, setShowUsernameForm] = useState(false);
  const [user, setUser] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();

  const handleUsernameSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session?.access_token) {
        throw new Error(
          "Authentication session expired. Please sign in again."
        );
      }

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/auth/set-username`,
        {
          supabaseUid: user.id,
          username,
          email: user.email,
        },
        {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            "Content-Type": "application/json",
          },
        }
      );
      const accessToken = response.data.accessToken || session.access_token;
      localStorage.setItem("token", response.data.accessToken || session.access_token);
      localStorage.setItem("username", username);
      localStorage.setItem("email", user.email);

      localStorage.setItem("token", accessToken);
      localStorage.setItem("username", username);
      localStorage.setItem("email", user.email);

      // Call signIn to update auth context
      await signIn(user.email, accessToken, true);


      // await signIn(user.email, response.data.accessToken);
      navigate("/profile");
    } catch (err) {
      console.error("Registration error:", err);
      setError(
        err.response?.data?.message ||
          err.message ||
          "Registration failed. Please try again."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  useEffect(() => {
    async function handleCallback() {
      try {
        console.log("Starting Google callback process");

        // First get the session
        const {
          data: { session },
          error: sessionError,
        } = await supabase.auth.getSession();

        if (sessionError || !session?.access_token) {
          throw new Error("Could not authenticate session");
        }

        // Then get user details
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          throw new Error("Could not fetch user details");
        }


        setUser(user);
        console.log("User authenticated:", user.id);
        localStorage.setItem("token", session.access_token);

        try {
          // Check if user exists in our system
          const profileResponse = await axios.get(
              `${import.meta.env.VITE_API_BASE_URL}/api/users/check-user`,
              {
                params: { supabaseUid: user.id },
                headers: {
                  Authorization: `Bearer ${session.access_token}`,
                },
              }
          );

          if (profileResponse.data.exists) {
            // User exists - get profile and redirect
            const profile = await axios.get(
                `${import.meta.env.VITE_API_BASE_URL}/api/users/profile`,
                {
                  headers: {
                    Authorization: `Bearer ${session.access_token}`,
                  },
                }
            );

            localStorage.setItem("username", profile.data.username || "");
            localStorage.setItem("email", profile.data.email || "");
            // await signIn(user.email, session.access_token);
            navigate("/profile");
          } else {
            // New user - show username form
            setShowUsernameForm(true);
          }
        } catch (err) {
          if (err.response?.status === 404) {
            setShowUsernameForm(true);
          } else {
            throw err;
          }
        }
      } catch (error) {
        console.error("Callback error:", error);
        setError(error.message || "Login processing failed. Please try again.");
        navigate("/login");
      } finally {
        setLoading(false);
      }
    }

    handleCallback();
  }, [navigate, signIn]);

  if (loading) {
    return (
        <div className="google-callback-page">
          <div className="callback-container loading-container">
            <div className="loading-spinner"></div>
            <p>Processing your sign in...</p>
          </div>
        </div>
    )
  }

  return (
      <div className="google-callback-page">
        <div className="callback-container">
          <div className="para-logo">
            <img src="/path-to-your-logo.png" alt="PARA Logo" />
          </div>

          {showUsernameForm ? (
              <div className="username-form-wrapper">
                <h2>Almost there!</h2>
                <p>Please choose a username to complete your registration</p>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleUsernameSubmit} className="username-form">
                  <div className="form-group">
                    <input
                        type="text"
                        placeholder="Choose a username"
                        className="form-input"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                        disabled={isSubmitting}
                    />
                  </div>

                  <button type="submit" className="register-button" disabled={isSubmitting}>
                    {isSubmitting ? "Processing..." : "Complete Registration"}
                  </button>
                </form>
              </div>
          ) : (
              error && <div className="error-message">{error}</div>
          )}
        </div>
      </div>
  )
}

export default GoogleCallback
