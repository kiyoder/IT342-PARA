import React, { useState } from 'react';
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
    const navigate = useNavigate();

    const handlePasswordChange = (e) => {
        const newPassword = e.target.value;
        setPassword(newPassword);
        setPasswordStrength(checkPasswordStrength(newPassword));
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

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (password !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }
        if (passwordStrength !== 'Strong') {
            setError('Password must be strong');
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
        }
        ;

        return (
            <div>
                <h2>Register</h2>
                {error && <p style={{color: 'red'}}>{error}</p>}
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
                        <label>Email</label>
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>
                    <div>
                        <label>Password</label>
                        <input
                            type={showPassword ? "text" : "password"} // Toggle input type
                            value={password}
                            onChange={handlePasswordChange}
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
                        <div className="progress-bar">
                            <div className="progress-segment"
                                 style={{backgroundColor: getBarColor(passwordStrength, 0)}}></div>
                            <div className="progress-segment"
                                 style={{backgroundColor: getBarColor(passwordStrength, 1)}}></div>
                            <div className="progress-segment"
                                 style={{backgroundColor: getBarColor(passwordStrength, 2)}}></div>
                        </div>
                        <div className="password-strength-text">
                        <span
                            style={{color: passwordStrength === 'Weak' ? 'red' : passwordStrength === 'Medium' ? 'orange' : 'green'}}>
                            {passwordStrength}
                        </span>
                        </div>
                    </div>
                    <div>
                        <label>Confirm Password</label>
                        <input
                            type={showPassword ? "text" : "password"} // Toggle input type
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            required
                        />
                    </div>
                    <button type="submit">Register</button>
                </form>
            </div>
        );
}

export default Register;