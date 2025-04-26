import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { createClient } from "@supabase/supabase-js";
import axios from "axios";
import "../styles/GoogleCallback.css";

const supabase = createClient(
    'https://lqeeloeqlznjgkkjejpu.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImxxZWVsb2VxbHpuamdra2planB1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDQxODY3MzMsImV4cCI6MjA1OTc2MjczM30.x2ywW2R20yE6vFEdZ5-X0Ueqs5htUiUYUALf-cNOH5E'
);

function GoogleCallback() {
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
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (sessionError || !session?.access_token) {
                throw new Error("Authentication session expired. Please sign in again.");
            }

            const response = await axios.post('http://localhost:8080/api/auth/set-username', {
                supabaseUid: user.id,
                username,
                email: user.email // Include email if needed by backend
            }, {
                headers: {
                    Authorization: `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json'
                }
            });

            localStorage.setItem("token", response.data.accessToken);
            window.location.href = "/";
        } catch (err) {
            console.error("Registration error:", err);
            setError(err.response?.data?.message ||
                err.message ||
                "Registration failed. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    useEffect(() => {
        async function handleCallback() {
            try {
                console.log("Starting Google callback process");

                // First get the session
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError || !session?.access_token) {
                    throw new Error("Could not authenticate session");
                }

                // Then get user details
                const { data: { user }, error: userError } = await supabase.auth.getUser();

                if (userError || !user) {
                    throw new Error("Could not fetch user details");
                }

                setUser(user);
                console.log("User authenticated:", user.id);

                try {
                    // Check user existence with proper auth headers
                    const response = await axios.get(`http://localhost:8080/api/users/check-user`, {
                        params: { supabaseUid: user.id },
                        headers: {
                            Authorization: `Bearer ${session.access_token}`,
                            'Content-Type': 'application/json'
                        },
                        validateStatus: (status) => status === 200 || status === 404
                    });

                    if (response.status === 200 && response.data.exists) {
                        // Existing user - log them in
                        const loginResponse = await axios.post(
                            'http://localhost:8080/api/auth/google-login',
                            { supabaseUid: user.id },
                            {
                                headers: {
                                    Authorization: `Bearer ${session.access_token}`,
                                    'Content-Type': 'application/json'
                                }
                            }
                        );

                        localStorage.setItem("token", loginResponse.data.accessToken);
                        window.location.href = "/";
                    } else {
                        // New user - show username form
                        setShowUsernameForm(true);
                    }
                } catch (err) {
                    console.error("User check error:", err);
                    if (err.response?.status === 403) {
                        // Special handling for 403 - likely auth issue
                        setError("Authentication failed. Please sign out and try again.");
                    } else {
                        setError("Failed to check user status. Please try again.");
                    }
                }
            } catch (error) {
                console.error("Callback error:", error);
                setError(error.message || "Login processing failed. Please try again.");
                navigate("/login"); // Redirect to login on critical errors
            } finally {
                setLoading(false);
            }
        }

        handleCallback();
    }, [navigate]);


    if (loading) {
        return (
            <div className="google-callback-page">
                <div className="callback-container loading-container">
                    <div className="loading-spinner"></div>
                    <p>Processing your sign in...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="google-callback-page">
            <div className="callback-container">
                <div className="para-logo">
                    <svg
                        width="120"
                        height="100"
                        viewBox="0 0 294 250"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                    >
                        <path
                            d="M249.35 132.009V44.0029H264.018V0H29.3353V44.0029H44.0029V132.009H0C0 145.65 7.33382 157.091 22.0015 160.317V234.682C22.0015 238.572 23.5468 242.303 26.2975 245.054C29.0482 247.805 32.779 249.35 36.6691 249.35H51.3368C55.2269 249.35 58.9576 247.805 61.7084 245.054C64.4591 242.303 66.0044 238.572 66.0044 234.682V220.015H227.349V234.682C227.349 238.572 228.894 242.303 231.645 245.054C234.395 247.805 238.126 249.35 242.016 249.35H256.684C260.574 249.35 264.305 247.805 267.055 245.054C269.806 242.303 271.351 238.572 271.351 234.682V160.317C286.019 156.944 293.353 145.65 293.353 132.009H249.35ZM88.0059 161.344C82.1707 161.344 76.5746 159.026 72.4485 154.9C68.3224 150.774 66.0044 145.178 66.0044 139.343C66.0044 133.507 68.3224 127.911 72.4485 123.785C76.5746 119.659 82.1707 117.341 88.0059 117.341C93.841 117.341 99.4372 119.659 103.563 123.785C107.689 127.911 110.007 133.507 110.007 139.343C110.007 145.178 107.689 150.774 103.563 154.9C99.4372 159.026 93.841 161.344 88.0059 161.344ZM205.347 161.344C199.512 161.344 193.916 159.026 189.79 154.9C185.664 150.774 183.346 145.178 183.346 139.343C183.346 133.507 185.664 127.911 189.79 123.785C193.916 119.659 199.512 117.341 205.347 117.341C211.182 117.341 216.778 119.659 220.904 123.785C225.031 127.911 227.349 133.507 227.349 139.343C227.349 145.178 225.031 150.774 220.904 154.9C216.778 159.026 211.182 161.344 205.347 161.344ZM227.349 95.3397C204.174 90.6461 176.452 88.0059 146.676 88.0059C116.901 88.0059 88.0059 90.6461 66.0044 95.3397V44.0029H227.349V95.3397Z"
                            fill="#FF3B10"
                        />
                    </svg>
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
    );
}

export default GoogleCallback;