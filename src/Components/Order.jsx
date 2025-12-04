// src/pages/Orders.jsx
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const Orders = ({ darkMode }) => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState({}); // { orderId: remainingSeconds }

  const theme = {
    bg: darkMode ? "#000" : "#f8f9fa",
    card: darkMode ? "#111" : "#fff",
    text: darkMode ? "#fff" : "#222",
    muted: darkMode ? "#aaa" : "#666",
    border: darkMode ? "#333" : "#ddd",
  };

  // Format seconds → MM:SS
  const formatTime = (seconds) => {
    const mins = Math.floor(Math.max(seconds, 0) / 60)
      .toString()
      .padStart(2, "0");
    const secs = (Math.max(seconds, 0) % 60).toString().padStart(2, "0");
    return `${mins}:${secs}`;
  };

  // Fetch orders
  useEffect(() => {
    const fetchOrders = async () => {
      let fetched = [];

      if (user) {
        try {
          const token = localStorage.getItem("token");
          const res = await axios.get("https://nextgenpcsbackend.onrender.com/orders", {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetched = res.data;
        } catch (err) {
          console.error("Failed to fetch orders:", err);
        }
      } else {
        const guestCart = JSON.parse(localStorage.getItem("cart_guest") || "[]");
        if (guestCart.length > 0) {
          fetched = [{ _id: "guest_001", items: guestCart, delivery: "pickup", createdAt: Date.now() }];
        }
      }

      setOrders(fetched);
      initializeTimers(fetched);
      setLoading(false);
    };

    const initializeTimers = (ordersList) => {
      const initial = {};
      ordersList.forEach((order) => {
        const duration = order.delivery === "delivery" ? 600 : 120; // 10min or 2min
        const savedStart = localStorage.getItem(`timer_start_${order._id}`);

        if (!savedStart) {
          const start = Date.now();
          localStorage.setItem(`timer_start_${order._id}`, start);
          localStorage.setItem(`timer_duration_${order._id}`, duration);
          initial[order._id] = duration;
        } else {
          const elapsed = Math.floor((Date.now() - Number(savedStart)) / 1000);
          const remaining = Math.max(duration - elapsed, 0);
          initial[order._id] = remaining;
        }
      });
      setTimers(initial);
    };

    fetchOrders();
  }, [user]);

  // Countdown + Email Trigger
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = { ...prev };

        Object.keys(updated).forEach((orderId) => {
          if (updated[orderId] > 0) {
            updated[orderId] -= 1;

            // Trigger email exactly once when timer hits 0
            if (updated[orderId] === 0 && prev[orderId] === 1) {
              const order = orders.find((o) => o._id === orderId);
              if (order && user) {
                axios.post("https://nextgenpcsbackend.onrender.com/send-order-email", {
                  userEmail: user.email,
                  orderId,
                  delivery: order.delivery,
                }).catch(console.error);
              }
            }
          }
        });

        return updated;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [orders, user]);

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: theme.text, fontSize: "18px" }}>
        Loading your orders...
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div style={{ textAlign: "center", padding: "80px", backgroundColor: theme.bg, minHeight: "100vh", color: theme.text }}>
        <h2>No orders yet</h2>
        <p style={{ color: theme.muted }}>Your orders will appear here once placed.</p>
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: "100vh", padding: "30px 20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "40px", color: theme.text, fontSize: "32px" }}>
        Your Orders
      </h1>

      <div style={{ maxWidth: "1000px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "30px" }}>
        {orders.map((order) => (
          <div
            key={order._id}
            style={{
              backgroundColor: theme.card,
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              border: `1px solid ${theme.border}`,
            }}
          >
            {/* Header */}
            <div style={{ padding: "20px", borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, fontSize: "18px", color: theme.text }}>
                  Order #{order._id.slice(-8)}
                </h3>
                <span style={{ color: theme.muted, fontSize: "14px" }}>
                  {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Items */}
            <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "15px", backgroundColor: darkMode ? "#222" : "#f9f9f9", padding: "15px", borderRadius: "12px" }}>
                  <img
                    src={item.image_url || item.image || "/no-image.png"}
                    alt={item.model}
                    style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "10px" }}
                  />
                  <div>
                    <strong style={{ color: theme.text }}>{item.brand || "Unknown"}</strong>
                    <p style={{ margin: "4px 0", color: theme.muted, fontSize: "14px" }}>{item.model || item.product_name}</p>
                    <p style={{ margin: "8px 0", fontWeight: "bold" }}>R {item.price?.toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Delivery Info + Timer */}
            <div style={{ padding: "0 20px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <span style={{ fontWeight: "bold", color: theme.text }}>
                  {order.delivery === "delivery" ? "Delivery in Progress" : "Ready for Pickup"}
                </span>
                <span style={{ fontSize: "24px", fontWeight: "bold", color: timers[order._id] <= 60 ? "#e74c3c" : "#2ecc71" }}>
                  {formatTime(timers[order._id] || 0)}
                </span>
              </div>

              {/* Map */}
              <div style={{ height: "320px", borderRadius: "12px", overflow: "hidden", border: `2px solid ${theme.border}` }}>
                {order.delivery === "delivery" ? (
                  <DeliveryMap countdown={timers[order._id] || 0} />
                ) : (
                  <PickupMap />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Delivery Map with Moving Car
const DeliveryMap = ({ countdown }) => {
  const progress = ((600 - countdown) / 600) * 100;
  const carPosition = Math.min(progress, 100);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#333", overflow: "hidden" }}>
      {/* Roads */}
      {["25%", "50%", "75%"].map((pos) => (
        <div key={pos} style={{ position: "absolute", top: pos, left: 0, width: "100%", height: "50px", background: "#555", border: "2px dashed #777" }} />
      ))}
      {["20%", "40%", "60%", "80%"].map((pos) => (
        <div key={pos} style={{ position: "absolute", top: 0, left: pos, width: "40px", height: "100%", background: "#555", border: "2px dashed #777" }} />
      ))}

      {/* Traffic Lights */}
      {["20%", "50%", "80%"].map((left) => (
        <div key={left} style={{ position: "absolute", top: "20%", left, transform: "translateX(-50%)" }}>
          <div style={{ width: "16px", height: "44px", background: "#222", borderRadius: "8px", padding: "4px 0", display: "flex", flexDirection: "column", gap: "4px" }}>
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#e74c3c", margin: "0 auto" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#f1c40f", margin: "0 auto" }} />
            <div style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#2ecc71", margin: "0 auto" }} />
          </div>
        </div>
      ))}

      {/* Car */}
      <div
        style={{
          position: "absolute",
          left: `${carPosition}%`,
          top: "50%",
          transform: "translate(-50%, -50%)",
          fontSize: "48px",
          transition: "left 0.8s linear",
          filter: "drop-shadow(0 0 10px #fff)",
        }}
      >
        
      </div>

      {/* Labels */}
      <div style={{ position: "absolute", left: "5%", top: "15%", color: "#fff", fontWeight: "bold", fontSize: "18px" }}>STORE</div>
      <div style={{ position: "absolute", right: "5%", top: "15%", color: "#fff", fontWeight: "bold", fontSize: "18px" }}>YOU</div>
    </div>
  );
};

// Pickup Map with Glowing Store
const PickupMap = () => {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#222", overflow: "hidden" }}>
      {/* Roads */}
      {["30%", "70%"].map((pos) => (
        <div key={pos} style={{ position: "absolute", top: pos, left: 0, width: "100%", height: "60px", background: "#444", border: "3px dashed #666" }} />
      ))}
      {["25%", "50%", "75%"].map((pos) => (
        <div key={pos} style={{ position: "absolute", top: 0, left: pos, width: "60px", height: "100%", background: "#444", border: "3px dashed #666" }} />
      ))}

      {/* Glowing Store */}
      <div
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "100px",
          height: "100px",
          background: "#00ff9d",
          borderRadius: "50%",
          boxShadow: "0 0 60px #00ff9d, 0 0 120px #00ff9d",
          animation: "pulse 2s infinite",
        }}
      />

      <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)", color: "#fff", fontSize: "28px", fontWeight: "bold", textShadow: "0 0 20px #000" }}>
        STORE
      </div>

      <style jsx>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 60px #00ff9d, 0 0 120px #00ff9d; }
          50% { box-shadow: 0 0 80px #00ff9d, 0 0 160px #00ff9d; }
          100% { box-shadow: 0 0 60px #00ff9d, 0 0 120px #00ff9d; }
        }
      `}</style>
    </div>
  );
};

export default Orders;