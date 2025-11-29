import React, { useState, useEffect, useContext } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from '../context/AuthContext';

const Navbar = ({ darkMode, toggleMode }) => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [isAuth, setIsAuth] = useState(!!user);
  const [cartCount, setCartCount] = useState(0);

  const cartKey = user ? `cart_${user.id}` : "cart_guest";

  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    setCartCount(cart.length);
  }, [cartKey]);

  useEffect(() => setIsAuth(!!user), [user]);

  useEffect(() => {
    const handler = () => {
      const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
      setCartCount(cart.length);
    };
    window.addEventListener("storage", handler);
    window.addEventListener("localStorageChanged", handler);
    return () => {
      window.removeEventListener("storage", handler);
      window.removeEventListener("localStorageChanged", handler);
    };
  }, [cartKey]);

  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const navStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 30px",
    backgroundColor: "#000",
    color: "#ff0000",
    boxShadow: "0 2px 10px rgba(255,0,0,0.5)",
    position: "fixed",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    height: "70px",
    borderBottom: "3px solid #b80000",
  };

  const linkStyles = {
    color: "#ff0000",
    textDecoration: "none",
    fontSize: "18px",
    fontWeight: "bold",
    padding: "8px 16px",
    borderRadius: "8px",
    transition: "all 0.3s",
  };

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={navStyles}>
      <div>
        <Link to="/home" style={{...linkStyles, fontSize: "28px", color: "#ff0000"}}>NextGenPC</Link>
      </div>

      <div style={{ display: "flex", gap: "25px", alignItems: "center" }}>
        <Link to="/home" style={linkStyles}>Home</Link>
        <Link to="/products" style={linkStyles}>Products</Link>
        <Link to="/cart" style={linkStyles}>Cart ({cartCount})</Link>
        <Link to="/checkout" style={linkStyles}>Checkout</Link>
        <Link to="/orders" style={linkStyles}>Orders</Link>
        <Link to="/profile" style={linkStyles}>Profile</Link>

        <button onClick={toggleMode} style={{background: "none", border: "none", fontSize: "24px", cursor: "pointer"}}>
          {darkMode ? "☀️" : "🌙"}
        </button>

        {isAuth && (
          <button onClick={handleLogout} style={{
            backgroundColor: "#ff0000",
            color: "#fff",
            border: "none",
            padding: "10px 20px",
            borderRadius: "8px",
            cursor: "pointer",
            fontWeight: "bold",
            fontSize: "16px"
          }}>
            Logout
          </button>
        )}
      </div>
    </nav>
  );
};

export default Navbar;