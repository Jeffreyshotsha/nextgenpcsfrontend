import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider } from './Components/AuthContext';
import Signup from './Components/Signup';
import Login from './Components/Login';
import Home from './Components/Home';
import Product from './Components/Product';
import Cart from './Components/Cart';
import Checkout from './Components/Checkout';
import Order from './Components/Order';
import Profile from './Components/Profile';
import Navbar from './Components/Navbar';
import { useState, useEffect } from 'react';

// -------------------- 🔹 IP Switcher Hook --------------------
const useApiIp = () => {
  const urlParams = new URLSearchParams(window.location.search);
  const defaultIp = urlParams.get("ip") || localStorage.getItem("apiIp") || "54.210.134.176"; // default EC2 IP
  const [ip, setIp] = useState(defaultIp);

  const updateIP = (newIp) => {
    if (!newIp) return;
    const url = new URL(window.location);
    url.searchParams.set("ip", newIp);
    window.history.pushState({}, "", url); // Update URL in browser
    setIp(newIp);
    localStorage.setItem("apiIp", newIp); // Save IP locally
  };

  const getApiUrl = () => {
    const API_HOST = ip || "127.0.0.1";
    return `http://${API_HOST}:3000`; // adjust port if needed
  };

  return { ip, updateIP, getApiUrl };
};

// -------------------- 🔹 Protected Routes --------------------
const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('Auth');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// -------------------- 🔹 Layout Wrapper --------------------
const Layout = ({ children, darkMode, toggleMode }) => {
  const location = useLocation();
  const hideNavbarPaths = ['/', '/login'];
  const showNavbar = !hideNavbarPaths.includes(location.pathname);

  const darkModePages = ['/products', '/cart', '/checkout', '/profile'];
  const isDarkPage = darkMode && darkModePages.includes(location.pathname);

  const bgColor = isDarkPage ? '#000' : '#fff';
  const textColor = isDarkPage ? '#FFFF00' : '#000';

  return (
    <div
      style={{
        backgroundColor: bgColor,
        color: textColor,
        minHeight: '100vh',
        transition: 'all 0.3s ease',
      }}
    >
      {showNavbar && <Navbar darkMode={isDarkPage} toggleMode={toggleMode} />}
      {children}
    </div>
  );
};

// -------------------- 🔹 Main App --------------------
function App() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleMode = () => setDarkMode(!darkMode);

  // -------------------- 🔹 Use IP Hook --------------------
  const { ip, updateIP, getApiUrl } = useApiIp();

  useEffect(() => {
    console.log("Current API base URL:", getApiUrl());
  }, [ip]);

  return (
    <AuthProvider>
      <BrowserRouter>
        {/* Small helper UI to change EC2 IP dynamically */}
        <div style={{ padding: "10px", background: "#eee" }}>
          <input
            type="text"
            value={ip}
            placeholder="Enter EC2 Public IP"
            onChange={(e) => updateIP(e.target.value)}
            style={{ marginRight: "10px" }}
          />
          <span>API Base: {getApiUrl()}</span>
        </div>

        <Layout darkMode={darkMode} toggleMode={toggleMode}>
          <Routes>
            <Route path="/" element={<Signup apiBase={getApiUrl()} />} />
            <Route path="/login" element={<Login apiBase={getApiUrl()} />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home apiBase={getApiUrl()} />
                </ProtectedRoute>
              }
            />
            <Route path="/products" element={<Product darkMode={darkMode} apiBase={getApiUrl()} />} />
            <Route path="/cart" element={<Cart darkMode={darkMode} apiBase={getApiUrl()} />} />
            <Route path="/checkout" element={<Checkout darkMode={darkMode} apiBase={getApiUrl()} />} />
            <Route path="/profile" element={<Profile darkMode={darkMode} apiBase={getApiUrl()} />} />
            <Route path="/orders/:orderId" element={<Order darkMode={darkMode} apiBase={getApiUrl()} />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
