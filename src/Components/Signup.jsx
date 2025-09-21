import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { AuthContext } from './AuthContext';

const Signup = ({ getApiUrl }) => {
  const { login } = useContext(AuthContext);
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [alert, setAlert] = useState(null); 
  const navigate = useNavigate();

  const handleSignup = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${getApiUrl()}/signup`, {
        email,
        username,
        password,
        phone,
      });

      if (response.data.email) {
        login({
          email: response.data.email,
          username: response.data.username,
          phone: response.data.phone,
        });

        localStorage.setItem('Auth', btoa(`${email}:${password}`));

        setAlert({ type: 'success', message: `Welcome ${username} to NextGenPcs.com!` });
        setTimeout(() => navigate('/home'), 1500);
      }
    } catch (err) {
      console.error(err);
      setError('Signup failed. Try again.');
    }
  };

  useEffect(() => {
    if (alert) {
      const timer = setTimeout(() => setAlert(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [alert]);

  return (
    <div style={styles.container}>
      <h2 style={styles.title}>Sign Up</h2>
      {error && <p style={styles.error}>{error}</p>}
      <form onSubmit={handleSignup} style={styles.form}>
        <input style={styles.input} type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
        <input style={styles.input} type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        <input style={styles.input} type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
        <input style={styles.input} type="tel" placeholder="Phone Number" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        <button style={styles.button} type="submit">Sign Up</button>
      </form>
      <p style={styles.linkText}>
        Already have an account? <Link to="/login" style={styles.link}>Login</Link>
      </p>

      {alert && (
        <div style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          backgroundColor: alert.type === 'success' ? '#4caf50' : '#2196f3',
          color: '#fff',
          padding: '15px 25px',
          borderRadius: '8px',
          fontWeight: 'bold',
          boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
          zIndex: 1000,
          transition: 'all 0.3s ease',
        }}>
          {alert.message}
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    maxWidth: '400px',
    margin: '50px auto',
    padding: '30px',
    backgroundColor: '#fff',
    color: '#000',
    border: '1px solid #000',
    borderRadius: '8px',
    fontFamily: 'Arial, sans-serif',
    boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
  },
  title: { textAlign: 'center', marginBottom: '20px', fontWeight: 'bold' },
  error: { color: 'red', textAlign: 'center', marginBottom: '10px' },
  form: { display: 'flex', flexDirection: 'column', gap: '15px' },
  input: { padding: '12px', border: '1px solid #000', borderRadius: '5px', backgroundColor: '#fff', color: '#000', fontSize: '16px', outline: 'none' },
  button: { padding: '12px', border: '1px solid #000', borderRadius: '5px', backgroundColor: '#000', color: '#fff', fontSize: '16px', fontWeight: 'bold', cursor: 'pointer', transition: '0.3s' },
  linkText: { textAlign: 'center', marginTop: '15px', fontSize: '14px', color: '#000' },
  link: { color: '#000', textDecoration: 'underline', fontWeight: 'bold' },
};

export default Signup;
