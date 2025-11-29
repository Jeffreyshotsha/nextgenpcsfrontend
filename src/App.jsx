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

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = !!localStorage.getItem('user');
  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

const Layout = ({ children, darkMode, toggleMode }) => {
  const location = useLocation();
  const showNavbar = !['/', '/login', '/signup'].includes(location.pathname);

  return (
    <div style={{
      margin: 0,
      padding: 0,
      minHeight: "100vh",
      width: "100vw",
      backgroundColor: darkMode ? "#000" : "#f5f5f5",
      color: darkMode ? "#fff" : "#000",
      overflowX: "hidden",
      position: "fixed",
      top: 0, left: 0, right: 0, bottom: 0,
    }}>
      <div style={{ position: "relative", minHeight: "100vh", width: "100%" }}>
        {showNavbar && <Navbar darkMode={darkMode} toggleMode={toggleMode} />}
        <div style={{ paddingTop: showNavbar ? "80px" : "0" }}>
          {children}
        </div>
      </div>
    </div>
  );
};

function App() {
  // FULLY WORKING LIGHT/DARK MODE AGAIN
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved !== null ? JSON.parse(saved) : true;
  });

  const toggleMode = () => {
    setDarkMode(prev => {
      const newMode = !prev;
      localStorage.setItem('darkMode', JSON.stringify(newMode));
      return newMode;
    });
  };

  useEffect(() => {
    document.documentElement.style.margin = "0";
    document.documentElement.style.padding = "0";
    document.body.style.margin = "0";
    document.body.style.padding = "0";
    document.body.style.backgroundColor = darkMode ? "#000" : "#f5f5f5";
  }, [darkMode]);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout darkMode={darkMode} toggleMode={toggleMode}>
          <Routes>
            <Route path="/" element={<Signup />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/products" element={<Product darkMode={darkMode} />} />
            <Route path="/cart" element={<Cart darkMode={darkMode} />} />
            <Route path="/checkout" element={<Checkout darkMode={darkMode} />} />
            <Route path="/orders" element={<ProtectedRoute><Orders darkMode={darkMode} /></ProtectedRoute>} />
            <Route path="/order" element={<ProtectedRoute><Orders darkMode={darkMode} /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile darkMode={darkMode} /></ProtectedRoute>} />
            <Route path="*" element={<div style={{padding: "100px", textAlign: "center", color: darkMode ? "#fff" : "#000"}}>404 - Not Found</div>} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;