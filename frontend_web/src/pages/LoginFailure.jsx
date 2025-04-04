import React from "react";
import { Link } from "react-router-dom";

function LoginFailure() {
    return (
        <div>
            <h2>Login Failed</h2>
            <p>There was an issue with your login attempt. Please try again.</p>
            <Link to="/login">Go back to Login</Link>
        </div>
    );
}

export default LoginFailure;