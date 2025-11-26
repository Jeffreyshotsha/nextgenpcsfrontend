import React, { useState, useEffect } from 'react';
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
  useLocation,
} from 'react-router-dom';
import { AuthProvider } from "./context/AuthContext";

// Components
import Signup from './Components/Signup';
import Login from './Components/Login';
import Home from './Components/Home';
import Product from './Components/Product';
import Cart from './Components/Cart';
import Checkout from './Components/Checkout';
import Orders from './Components/Order'; 
import Profile from './Components/Profile';
import Navbar from './Components/Navbar';

// Protected Route
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('user'); 
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Layout Wrapper
const Layout = ({ children, darkMode, toggleMode }) => {
  const location = useLocation();
  const hideNavbarPaths = ['/', '/login', '/signup'];
  const showNavbar = !hideNavbarPaths.includes(location.pathname);

  const darkModePages = ['/products', '/cart', '/checkout', '/orders', '/order', '/profile'];
  const isDarkPage = darkMode && darkModePages.includes(location.pathname);

  const bgColor = isDarkPage ? '#000000ab' : '#ffffffb0';
  const textColor = isDarkPage ? '#b80000ff' : '#000';

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
        minHeight: '100vh',
        transition: 'all 0.3s ease',
      }}
    >
      {showNavbar && <Navbar darkMode={darkMode} toggleMode={toggleMode} />}
      <main>{children}</main>
    </div>
  );
};

// 404 Page
const NotFound = () => (
  <div style={{ textAlign: 'center', padding: '100px 20px' }}>
    <h1 style={{ fontSize: '48px', marginBottom: '16px' }}>404</h1>
    <p>Page not found</p>
    <a href="/home" style={{ color: '#b80000ff', textDecoration: 'underline' }}>
      Go back home
    </a>
  </div>
);

// Main App
function App() {
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    if (saved !== null) return JSON.parse(saved);
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  const toggleMode = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout darkMode={darkMode} toggleMode={toggleMode}>
          <Routes>
            {/* Public */}
            <Route path="/" element={<Signup />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />

            {/* Protected */}
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />

            {/* Public pages */}
            <Route path="/products" element={<Product darkMode={darkMode} />} />
            <Route path="/cart" element={<Cart darkMode={darkMode} />} />
            <Route path="/checkout" element={<Checkout darkMode={darkMode} />} />

            {/* Orders */}
            <Route
              path="/orders"
              element={
                <ProtectedRoute>
                  <Orders darkMode={darkMode} />
                </ProtectedRoute>
              }
            />
            <Route
              path="/order"
              element={
                <ProtectedRoute>
                  <Orders darkMode={darkMode} />
                </ProtectedRoute>
              }
            />

            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile darkMode={darkMode} />
                </ProtectedRoute>
              }
            />

            {/* 404 */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
