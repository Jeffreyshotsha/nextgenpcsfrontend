// Enhanced Signup.jsx (React)
import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Signup = () => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [dob, setDob] = useState('');
  const [phone, setPhone] = useState('');
  const [agree, setAgree] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState('');
  const [error, setError] = useState('');
  const [alert, setAlert] = useState(null);
  const navigate = useNavigate();

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  const getStrength = (pw) => {
    if (pw.length < 6) return 'Weak';
    if (/^(?=.*[0-9])(?=.*[A-Z]).{8,}$/.test(pw)) return 'Strong';
    return 'Medium';
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    setError('');
    setAlert(null);

    if (!agree) {
      setError('You must agree to the terms and conditions.');
      return;
    }

    try {
      const response = await axios.post(`${apiBase}/signup`, {
        username, email, password, phone, dob,
      });

      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
        login(response.data.user);

        setAlert({ type: 'success', message: `Account created for ${response.data.user.username || email}!` });
        setTimeout(() => navigate('/home'), 1500);
      }
    } catch (err) {
      const msg = err.response?.data?.error || 'Signup failed. Please try again.';
      setError(msg);
    }
  };

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  useEffect(() => {
    setPasswordStrength(getStrength(password));
  }, [password]);

  return (
    <div style={styles.mainWrapper}>
      <div style={styles.header}>
        <h1 style={styles.headerTitle}>Welcome to NextGenPcs.com</h1>
        <p style={styles.headerSubtitle}>Create your account</p>
      </div>

      <div style={styles.container}>
        <h2 style={styles.title}>Sign Up</h2>
        {error && <p style={styles.error}>{error}</p>}

        <form onSubmit={handleSignup} style={styles.form}>
          <input style={styles.input} type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} />

          <input style={styles.input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />

          <div style={styles.passwordWrapper}>
            <input style={styles.input} type={showPassword ? 'text' : 'password'} placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <span style={styles.toggle} onClick={() => setShowPassword(!showPassword)}>
              {showPassword ? 'Hide' : 'Show'}
            </span>
          </div>

          {password && <p style={{ ...styles.strength, color: passwordStrength === 'Strong' ? 'green' : passwordStrength === 'Medium' ? 'orange' : 'red' }}>Strength: {passwordStrength}</p>}

          <input style={styles.input} type="date" value={dob} onChange={(e) => setDob(e.target.value)} />

          <input style={styles.input} type="tel" placeholder="Phone" value={phone} onChange={(e) => setPhone(e.target.value)} />

          <label style={styles.checkboxRow}>
            <input type="checkbox" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>I agree to the <a href="#">Terms & Conditions</a> and <a href="#">Privacy Policy</a></span>
          </label>

          <button style={styles.button} type="submit">Sign Up</button>
        </form>

        <p style={styles.linkText}>Already have an account? <Link to="/login" style={styles.link}>Login</Link></p>

        {alert && (
          <div style={styles.alert}>{alert.message}</div>
        )}
      </div>
    </div>
  );
};

// ANIMATIONS + DESIGN STYLING
const styles = {
  mainWrapper: { display: 'flex', flexDirection: 'column', alignItems: 'center', animation: 'fadeIn 1s ease-in', minHeight: '100vh', background: 'linear-gradient(135deg, #e3f2fd, #fce4ec)' },

  header: { textAlign: 'center', marginTop: '40px', marginBottom: '10px', animation: 'slideDown 0.8s ease' },
  headerTitle: { fontSize: '38px', fontWeight: '900', color: '#111', letterSpacing: '1px' },
  headerSubtitle: { fontSize: '18px', opacity: 0.7, marginTop: '-5px' },

  container: { maxWidth: '440px', width: '90%', margin: '20px auto', padding: '35px', background: 'white', borderRadius: '18px', boxShadow: '0 10px 30px rgba(0,0,0,0.12)', border: '1px solid #eee', animation: 'floatUp 0.9s ease' },
  title: { textAlign: 'center', marginBottom: '25px', fontWeight: 'bold', fontSize: '24px', color: '#222' },
  error: { color: 'red', textAlign: 'center', marginBottom: '10px', fontWeight: 'bold' },

  form: { display: 'flex', flexDirection: 'column', gap: '18px' },
  input: { padding: '14px', border: '1px solid #bbb', borderRadius: '10px', fontSize: '16px', outline: 'none', background: '#fafafa', transition: '0.3s', boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)' },

  passwordWrapper: { position: 'relative' },
  toggle: { position: 'absolute', right: '15px', top: '50%', transform: 'translateY(-50%)', cursor: 'pointer', fontSize: '14px', color: '#0066cc', fontWeight: 'bold' },

  strength: { marginTop: '-10px', fontSize: '14px', fontWeight: 'bold', textAlign: 'right' },

  checkboxRow: { display: 'flex', gap: '10px', alignItems: 'center', fontSize: '14px', marginTop: '5px' },

  button: { padding: '15px', background: 'black', color: '#fff', fontWeight: 'bold', borderRadius: '10px', border: 'none', cursor: 'pointer', fontSize: '17px', transition: '0.3s', letterSpacing: '0.5px', boxShadow: '0 4px 10px rgba(0,0,0,0.2)' },

  linkText: { textAlign: 'center', marginTop: '12px', fontSize: '14px' },
  link: { textDecoration: 'underline', color: '#000', fontWeight: 'bold' },

  alert: { position: 'fixed', top: '20px', right: '20px', backgroundColor: '#4caf50', color: '#fff', padding: '15px 25px', borderRadius: '10px', fontWeight: 'bold', boxShadow: '0 4px 8px rgba(0,0,0,0.2)', animation: 'fadeIn 0.6s ease' },
};

export default Signup;
