import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Cart = ({ darkMode }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [cart, setCart] = useState([]);
  const [alert, setAlert] = useState(null);
  const [loading, setLoading] = useState(true);

  const theme = {
    bg: darkMode ? "#000" : "#fff",
    cardBg: darkMode ? "#111" : "#fff",
    text: darkMode ? "#fff" : "#000",
    textMuted: darkMode ? "#ccc" : "#555",
    border: darkMode ? "#fff" : "#000",
    buttonBg: darkMode ? "#fff" : "#000",
    buttonText: darkMode ? "#000" : "#fff",
  };

  // Load cart from localStorage
  useEffect(() => {
    if (!user) {
      setCart([]);
      setLoading(false);
      return;
    }

    const stored = JSON.parse(localStorage.getItem(`cart_${user.id}`)) || [];
    setCart(stored);
    setLoading(false);
  }, [user]);

  const saveCart = (newCart) => {
    if (user) {
      localStorage.setItem(`cart_${user.id}`, JSON.stringify(newCart));
    }
    setCart(newCart);
    // 🔥 Notify Navbar to update cart count immediately
    window.dispatchEvent(new Event("localStorageChanged"));
  };

  const increaseQty = (id) => {
    const updated = cart.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );
    saveCart(updated);
  };

  const decreaseQty = (id) => {
    const updated = cart.map((item) =>
      item.id === id
        ? { ...item, quantity: Math.max(1, item.quantity - 1) }
        : item
    );
    saveCart(updated);
  };

  const removeItem = (id) => {
    const updated = cart.filter((item) => item.id !== id);
    saveCart(updated);
  };

  const totalPrice = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  if (loading) {
    return (
      <div style={{ textAlign: "center", marginTop: "60px", color: theme.text }}>
        Loading cart...
      </div>
    );
  }

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        color: theme.text,
        minHeight: "100vh",
        padding: "30px",
      }}
    >
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Your Cart</h1>

      {alert && (
        <div
          style={{
            position: "fixed",
            top: "20px",
            right: "20px",
            backgroundColor: theme.cardBg,
            color: theme.text,
            padding: "12px 20px",
            borderRadius: "8px",
            border: `1px solid ${theme.border}`,
            fontWeight: "bold",
            zIndex: 1000,
          }}
        >
          {alert}
        </div>
      )}

      {cart.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            marginTop: "60px",
            fontSize: "18px",
            color: theme.textMuted,
          }}
        >
          Your cart is empty.
        </div>
      ) : (
        <div style={{ maxWidth: "900px", margin: "0 auto" }}>
          {cart.map((item) => (
            <div
              key={item.id}
              style={{
                display: "flex",
                alignItems: "center",
                backgroundColor: theme.cardBg,
                border: `1px solid ${theme.border}`,
                borderRadius: "10px",
                padding: "15px",
                marginBottom: "18px",
              }}
            >
              <img
                src={item.image}
                alt={item.model}
                style={{
                  width: "110px",
                  height: "110px",
                  borderRadius: "8px",
                  objectFit: "cover",
                  marginRight: "20px",
                }}
              />

              <div style={{ flexGrow: 1 }}>
                <h3 style={{ margin: "5px 0" }}>
                  {item.brand} {item.model}
                </h3>
                <p style={{ margin: "5px 0", color: theme.textMuted }}>
                  Price: ZAR {item.price}
                </p>

                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button onClick={() => decreaseQty(item.id)} style={qtyBtn(theme)}>
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button onClick={() => increaseQty(item.id)} style={qtyBtn(theme)}>
                    +
                  </button>
                </div>
              </div>

              <button
                onClick={() => removeItem(item.id)}
                style={{
                  marginLeft: "20px",
                  backgroundColor: "red",
                  color: "#fff",
                  padding: "8px 12px",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                }}
              >
                Remove
              </button>
            </div>
          ))}

          <div
            style={{
              marginTop: "30px",
              paddingTop: "20px",
              borderTop: `2px solid ${theme.border}`,
              textAlign: "center",
            }}
          >
            <h2>Total: ZAR {totalPrice.toFixed(2)}</h2>

            {/* Proceed to Checkout */}
            <button
              onClick={() => navigate("/checkout")}
              style={{
                marginTop: "20px",
                padding: "12px 18px",
                backgroundColor: theme.buttonBg,
                color: theme.buttonText,
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                width: "200px",
                marginBottom: "15px",
              }}
            >
              Proceed to Checkout
            </button>

            {/* Continue Shopping */}
            <button
              onClick={() => navigate("/products")}
              style={{
                padding: "12px 18px",
                backgroundColor: "#535252ff",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
                width: "200px",
              }}
            >
              Continue Shopping
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const qtyBtn = (theme) => ({
  padding: "6px 12px",
  backgroundColor: theme.buttonBg,
  color: theme.buttonText,
  borderRadius: "6px",
  cursor: "pointer",
  border: "none",
  fontWeight: "bold",
});

export default Cart;
