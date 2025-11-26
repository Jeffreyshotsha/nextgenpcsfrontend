// src/components/Navbar.jsx
import React, { useState, useEffect, useContext } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from '../context/AuthContext';

const Navbar = ({ darkMode, toggleMode }) => {
  const { user } = useContext(AuthContext);
  const [isAuth, setIsAuth] = useState(!!user);
  const [cartCount, setCartCount] = useState(0);

  // FIXED: use user.id, same as Cart.jsx & Checkout.jsx
  const cartKey = user ? `cart_${user.id}` : "cart_guest";

  // Load cart count on load
  useEffect(() => {
    const cart = JSON.parse(localStorage.getItem(cartKey) || "[]");
    setCartCount(cart.length);
  }, [cartKey]);

  // Update auth state
  useEffect(() => {
    setIsAuth(!!user);
  }, [user]);

  // Listen for cart changes (same tab + cross tab)
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

  // Persist dark mode on change
  useEffect(() => {
    localStorage.setItem("darkMode", JSON.stringify(darkMode));
  }, [darkMode]);

  const navStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 30px",
    backgroundColor: darkMode ? "#293129ff" : "#fff",
    color: darkMode ? "#ff0000" : "#000",
    boxShadow: darkMode ? "0 2px 5px rgba(247,66,66,1)" : "0 2px 5px rgba(78,78,78,1)",
    position: "sticky",
    top: 0,
    zIndex: 1000,
    height: "60px",
  };

  const linkStyles = {
    color: darkMode ? "#ff0000" : "#000",
    textDecoration: "none",
    fontSize: "16px",
    padding: "5px 10px",
    borderRadius: "6px",
    transition: "all 0.3s ease",
  };

  return (
    <nav style={navStyles}>
      <div style={{ fontWeight: "bold", fontSize: "20px" }}>
        <Link to="/" style={linkStyles}>NextGenPC</Link>
      </div>

      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        {[
          "/home", "/products", "/cart", "/checkout", "/orders", "/profile",
        ].map((path) => {
          if (!isAuth && ["/cart", "/checkout", "/orders", "/profile"].includes(path)) return null;

          const label =
            path === "/home" ? "Home" :
            path === "/products" ? "Products" :
            path === "/cart" ? `Cart (${cartCount})` :
            path === "/checkout" ? "Checkout" :
            path === "/orders" ? "Orders" :
            "Profile";

          return (
            <Link key={path} to={path} style={linkStyles}>
              {label}
            </Link>
          );
        })}

        <button
          onClick={toggleMode}
          style={{
            padding: "5px 10px",
            borderRadius: "6px",
            border: "none",
            cursor: "pointer",
            fontWeight: "bold",
            backgroundColor: darkMode ? "#000" : "#050000ff",
            color: darkMode ? "#ff0000" : "#000",
          }}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
