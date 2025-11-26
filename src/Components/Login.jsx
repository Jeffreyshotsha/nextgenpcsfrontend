// src/pages/Login.jsx
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Login = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [error, setError] = useState('');
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setAlert(null);

    try {
      const response = await axios.post(`${apiBase}/login`, { email, password });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));

        // THIS IS THE ONLY LINE ADDED — FIXES CART FOR GOOD
        localStorage.setItem('userEmail', response.data.user.email);

        login(response.data.user);

        setAlert({
          type: 'success',
          message: `Welcome back, ${response.data.user.username || email}!`,
        });

        setTimeout(() => navigate('/home'), 1500);
      }
    } catch (err) {
      console.error('Login error:', err);

      const backendError = err.response?.data?.error;

      if (backendError === "Invalid email or password") {
        setError("Invalid email or password");
      } else if (backendError === "Account not found") {
        setError("Account not found");
      } else if (backendError === "Password is incorrect") {
        setError("Password is incorrect");
      } else {
        setError("Login failed. Please try again.");
      }
    }
  };

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  return (
    <div style={styles.pageWrapper}>

      {/* Header */}
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Welcome Back </h1>
        <p style={styles.headerSubtitle}>We're glad to see you again</p>
      </div>

      <div style={styles.container}>
        <h2 style={styles.title}>Login</h2>

        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleLogin} style={styles.form}>
          {/* Email */}
          <input
            style={styles.input}
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onFocus={(e) => (e.target.style.boxShadow = '0 0 6px rgba(0,0,0,0.2)')}
            onBlur={(e) => (e.target.style.boxShadow = 'none')}
            required
          />

          {/* Password + Show/Hide */}
          <div style={styles.passwordContainer}>
            <input
              style={{ ...styles.input, paddingRight: '45px' }}
              type={passwordVisible ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onFocus={(e) => (e.target.style.boxShadow = '0 0 6px rgba(0,0,0,0.2)')}
              onBlur={(e) => (e.target.style.boxShadow = 'none')}
              required
            />

            {/* Toggle button */}
            <button
              type="button"
              style={styles.showPasswordBtn}
              onClick={() => setPasswordVisible(!passwordVisible)}
            >
              {passwordVisible ? "Hide" : "Show"}
            </button>
          </div>

          {/* Login button */}
          <button
            style={styles.button}
            type="submit"
            onMouseEnter={(e) => (e.target.style.opacity = '0.85')}
            onMouseLeave={(e) => (e.target.style.opacity = '1')}
            onMouseDown={(e) => (e.target.style.transform = 'scale(0.97)')}
            onMouseUp={(e) => (e.target.style.transform = 'scale(1)')}
          >
            Login
          </button>
        </form>

        <p style={styles.linkText}>
          Don’t have an account?
          <Link to="/" style={styles.link}> Sign Up</Link>
        </p>
      </div>

      {alert && (
        <div
          style={{
            position: 'fixed',
            top: '20px',
            right: '20px',
            backgroundColor: '#2196f3',
            color: '#fff',
            padding: '15px 25px',
            borderRadius: '8px',
            fontWeight: 'bold',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            zIndex: 1000,
          }}
        >
          {alert.message}
        </div>
      )}
    </div>
  );
};

// Styling — 100% unchanged
const styles = {
  pageWrapper: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f5f5f5, #ececec)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '40px',
    paddingBottom: '40px',
  },
  header: { textAlign: 'center', marginBottom: '25px' },
  headerTitle: { fontSize: '34px', fontWeight: '800', color: '#000', margin: 0 },
  headerSubtitle: { fontSize: '16px', color: '#555', marginTop: '5px' },
  container: {
    width: '100%',
    maxWidth: '420px',
    padding: '40px',
    backgroundColor: '#ffffff',
    borderRadius: '14px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
    border: '1px solid #e5e5e5',
  },
  title: { textAlign: 'center', marginBottom: '25px', fontSize: '24px', fontWeight: 'bold' },
  error: { color: '#ff3b30', textAlign: 'center', marginBottom: '12px', fontWeight: 'bold', fontSize: '14px' },
  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  input: {
    padding: '14px',
    border: '1px solid #ccc',
    borderRadius: '8px',
    backgroundColor: '#fafafa',
    fontSize: '16px',
    outline: 'none',
  },
  passwordContainer: { position: 'relative', width: '100%' },
  showPasswordBtn: {
    position: 'absolute',
    right: '10px',
    top: '50%',
    transform: 'translateY(-50%)',
    background: 'none',
    border: 'none',
    color: '#000',
    fontWeight: 'bold',
    cursor: 'pointer',
  },
  button: {
    padding: '14px',
    border: 'none',
    borderRadius: '8px',
    backgroundColor: '#000',
    color: '#fff',
    fontSize: '17px',
    fontWeight: '600',
    cursor: 'pointer',
  },
  linkText: { textAlign: 'center', marginTop: '18px', fontSize: '15px', color: '#444' },
  link: { color: '#000', textDecoration: 'none', fontWeight: 'bold' },
};

export default Login;