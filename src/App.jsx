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
import { useState } from 'react';

const ProtectedRoute = ({ children }) => {
  const isAuthenticated = localStorage.getItem('Auth');
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// Layout wrapper
const Layout = ({ children, darkMode, toggleMode }) => {
  const location = useLocation();
  const hideNavbarPaths = ['/', '/login'];
  const showNavbar = !hideNavbarPaths.includes(location.pathname);

  // Only apply dark mode to selected pages
  const darkModePages = ['/products', '/cart', '/checkout', '/profile'];
  const isDarkPage = darkMode && darkModePages.includes(location.pathname);

  const bgColor = isDarkPage ? '#000' : '#fff';
  const textColor = isDarkPage ? '#FFFF00' : '#000';

  return (
    <div style={{ backgroundColor: bgColor, color: textColor, minHeight: '100vh', transition: 'all 0.3s ease' }}>
      {showNavbar && <Navbar darkMode={isDarkPage} toggleMode={toggleMode} />}
      {children}
    </div>
  );
};

function App() {
  const [darkMode, setDarkMode] = useState(false);
  const toggleMode = () => setDarkMode(!darkMode);

  return (
    <AuthProvider>
      <BrowserRouter>
        <Layout darkMode={darkMode} toggleMode={toggleMode}>
          <Routes>
            <Route path="/" element={<Signup />} />
            <Route path="/login" element={<Login />} />
            <Route
              path="/home"
              element={
                <ProtectedRoute>
                  <Home />
                </ProtectedRoute>
              }
            />
            <Route path="/products" element={<Product darkMode={darkMode} />} />
            <Route path="/cart" element={<Cart darkMode={darkMode} />} />
            <Route path="/checkout" element={<Checkout darkMode={darkMode} />} />
            <Route path="/profile" element={<Profile darkMode={darkMode} />} />
            <Route path="/orders/:orderId" element={<Order darkMode={darkMode} />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
