import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Navbar = ({ darkMode, toggleMode }) => {
  const [cartCount, setCartCount] = useState(0);
  const [isAuth, setIsAuth] = useState(false);

  useEffect(() => {
    const auth = localStorage.getItem("Auth");
    setIsAuth(!!auth);
    if (auth) {
      const cart = JSON.parse(localStorage.getItem("cart")) || [];
      setCartCount(cart.length);
    }
  }, []);

  useEffect(() => {
    const handleStorageChange = () => {
      const auth = localStorage.getItem("Auth");
      if (auth) {
        const cart = JSON.parse(localStorage.getItem("cart")) || [];
        setCartCount(cart.length);
      } else {
        setCartCount(0);
      }
    };
    window.addEventListener("storage", handleStorageChange);
    return () => window.removeEventListener("storage", handleStorageChange);
  }, []);

  const navStyles = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "10px 30px",
    backgroundColor: darkMode ? "#006400" : "rgba(255,255,255,0)",
    color: darkMode ? "#ff0000" : "#000",
    boxShadow: darkMode ? "0 2px 5px rgba(255, 255, 0, 0.9)" : "0 2px 5px rgba(0,0,0,0.92)",
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
        <Link
          to="/"
          style={linkStyles}
          onMouseEnter={(e) => (e.target.style.backgroundColor = darkMode ? "#ffff00" : "#ccc")}
          onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
        >
          NextGenPC
        </Link>
      </div>
      <div style={{ display: "flex", gap: "20px", alignItems: "center" }}>
        {["/home", "/products", "/cart", "/checkout", "/orders","/profile"].map((path, index) => {
          // Hide some links if not authenticated
          if (!isAuth && ["/cart", "/checkout","/orders", "/profile"].includes(path)) return null;

          const text =
            path === "/home"
              ? "Home"
              : path === "/products"
              ? "Products"
              : path === "/cart"
              ? `Cart ${isAuth ? `(${cartCount})` : ""}`
              : path === "/checkout"
              ? "Checkout"
              : "Profile"; // handles /profile

          return (
            <Link
              key={index}
              to={path}
              style={linkStyles}
              onMouseEnter={(e) => (e.target.style.backgroundColor = darkMode ? "#ffff00" : "#ccc")}
              onMouseLeave={(e) => (e.target.style.backgroundColor = "transparent")}
            >
              {text}
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
            backgroundColor: darkMode ? "#004d00" : "#ddd",
            color: darkMode ? "#ff0000" : "#000",
          }}
        >
          {darkMode ? "Light Mode" : "Dark Mode"}
        </button>
      </div>
    </nav>
  );
};

export default Navbar;
