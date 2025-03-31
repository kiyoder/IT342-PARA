import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './Register.css'; // Import the CSS file for styling

function Register() {
    const [username, setUsername] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false); // State for password visibility
    const [passwordStrength, setPasswordStrength] = useState(''); // State for password strength
    const [error, setError] = useState('');
    const [usernameValid, setUsernameValid] = useState(null);
    const [emailValid, setEmailValid] = useState(null);
    const [passwordValid, setPasswordValid] = useState(null);
    const [confirmPasswordValid, setConfirmPasswordValid] = useState(null);
    const [showPasswordPopup, setShowPasswordPopup] = useState(false); // State for password popup

    const navigate = useNavigate();

    useEffect(() => {
        if (username) {
            checkUsername(username);
        } else {
            setUsernameValid(null);
        }
    }, [username]);

    useEffect(() => {
        if (email && validateEmail(email)) {
            checkEmail(email);
        } else {
            setEmailValid(null);
        }
    }, [email]);

    const validateEmail = (email) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return emailRegex.test(email);
    };

    const validateUsername = (username) => {
        return username.length > 0;
    };

    const validatePassword = (password) => {
        return passwordStrength === 'Strong';
    };

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordStrength(checkPasswordStrength(newPassword));
    };

    const passwordTimeoutRef = useRef(null);

    const handlePasswordFocus = () => {
        passwordTimeoutRef.current = setTimeout(() => {
            setShowPasswordPopup(true);
        }, 4000);
    };

    const handlePasswordBlur = () => {
        setShowPasswordPopup(false);
    };

    const handleConfirmPasswordChange = (e) => {
        const newConfirmPassword = e.target.value;
        setConfirmPassword(newConfirmPassword);
        setConfirmPasswordValid(newConfirmPassword === password && newConfirmPassword !== '');
    };

    const checkPasswordStrength = (password) => {
        let strength = 'Weak';
        const regexes = [
            /[a-z]/,
            /[A-Z]/,
            /\d/,
            /[@#$%^&+=]/
        ];
        let passed = 0;
        regexes.forEach(regex => {
            if (regex.test(password)) passed++;
        });
        if (password.length >= 8 && passed >= 3) strength = 'Medium';
        if (password.length >= 8 && passed === 4) strength = 'Strong';
        setPasswordValid(strength === 'Strong');
        return strength;
    };

    const getBarColor = (strength, index) => {
        if (strength === 'Strong' || (strength === 'Medium' && index < 2) || (strength === 'Weak' && index < 1)) {
            if (strength === 'Strong') return 'green';
            if (strength === 'Medium') return 'orange';
            if (strength === 'Weak') return 'red';
        }
        return 'lightgray';
    };

    const checkUsername = async (username) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/users/check-username?username=${username}`);
            setUsernameValid(!response.data.exists);
        } catch (error) {
            console.error('Failed to check username:', error);
            setUsernameValid(false);
        }
    };

    const checkEmail = async (email) => {
        try {
            const response = await axios.get(`http://localhost:8080/api/users/check-email?email=${email}`);
            setEmailValid(!response.data.exists);
        } catch (error) {
            console.error('Failed to check email:', error);
            setEmailValid(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!validateUsername(username) || !usernameValid) {
            setError('Invalid or existing username');
            return;
        }
        if (!validateEmail(email) || !emailValid) {
            setError('Invalid or existing email');
            return;
        }
        if (!validatePassword(password)) {
            setError('Password must be strong');
            return;
        }
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        try {
            const response = await axios.post('http://localhost:8080/api/users/register', {
                username,
                email,
                password
            });
            console.log('Registration successful:', response.data);
            navigate('/login');
        } catch (error) {
            console.error('Registration failed:', error);
            setError(error.response ? error.response.data : 'Registration failed');
        }
    };

    const renderCriteria = (criteria, isMet) => (
        <li>
            {isMet ? <span className="check-mark">✔</span> : <span className="x-mark">✖</span>} {criteria}
        </li>
    );

    return (
        <div>
            <h2>Register</h2>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Username</label>
                    <input
                        type="text"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />
                    {usernameValid === null ? '' : usernameValid ? <span className="check-mark">✔</span> : <span className="x-mark">✖</span>}
                </div>
                <div>
                    <label>Email</label>
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        required
                    />
                    {emailValid === null ? '' : emailValid ? <span className="check-mark">✔</span> : <span className="x-mark">✖</span>}
                </div>
                <div style={{ position: 'relative' }}>
                    <label>Password</label>
                    <input
                        type={showPassword ? "text" : "password"} // Toggle input type
                        value={password}
                        onChange={handlePasswordChange}
                        onFocus={handlePasswordFocus}
                        onBlur={handlePasswordBlur}
                        required
                    />
                    {passwordValid === null ? '' : passwordValid ? <span className="check-mark">✔</span> : <span className="x-mark">✖</span>}
                    <div>
                        <input
                            type="checkbox"
                            checked={showPassword}
                            onChange={() => setShowPassword(!showPassword)}
                        />
                        <label>Show Password</label>
                    </div>
                    {showPasswordPopup && (
                        <div className="password-popup">
                            <p>Password must contain:</p>
                            <ul>
                                {renderCriteria('At least 8 characters', password.length >= 8)}
                                {renderCriteria('At least one lowercase letter', /[a-z]/.test(password))}
                                {renderCriteria('At least one uppercase letter', /[A-Z]/.test(password))}
                                {renderCriteria('At least one number', /\d/.test(password))}
                                {renderCriteria('At least one special character (@#$%^&+=)', /[@#$%^&+=]/.test(password))}
                            </ul>
                        </div>
                    )}
                    <div className="progress-bar">
                        <div className="progress-segment" style={{ backgroundColor: getBarColor(passwordStrength, 0) }}></div>
                        <div className="progress-segment" style={{ backgroundColor: getBarColor(passwordStrength, 1) }}></div>
                        <div className="progress-segment" style={{ backgroundColor: getBarColor(passwordStrength, 2) }}></div>
                    </div>
                    <div className="password-strength-text">
                        <span style={{ color: passwordStrength === 'Weak' ? 'red' : passwordStrength === 'Medium' ? 'orange' : 'green' }}>
                            {passwordStrength}
                        </span>
                    </div>
                </div>
                <div>
                    <label>Confirm Password</label>
                    <input
                        type={showPassword ? "text" : "password"} // Toggle input type
                        value={confirmPassword}
                        onChange={handleConfirmPasswordChange}
                        required
                    />
                    {confirmPasswordValid === null ? '' : confirmPasswordValid ? <span className="check-mark">✔</span> : <span className="x-mark">✖</span>}
                </div>
                <button type="submit">Register</button>
            </form>
        </div>
    );
}

export default Register;