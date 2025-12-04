// src/pages/Orders.jsx
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const Orders = ({ darkMode }) => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState({});

  const theme = {
    bg: darkMode ? "#000" : "#f8f9fa",
    card: darkMode ? "#111" : "#fff",
    text: darkMode ? "#fff" : "#222",
    muted: darkMode ? "#aaa" : "#666",
    border: darkMode ? "#333" : "#ddd",
    accent: "#00ff9d",
  };

  const formatTime = (s) => {
    const m = Math.floor(Math.max(s, 0) / 60).toString().padStart(2, "0");
    const sec = (Math.max(s, 0) % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

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
          fetched = [{
            _id: "guest_001",
            items: guestCart,
            delivery: "pickup",
            paymentType: "full",
            totalAmount: guestCart.reduce((a, i) => a + i.price * i.quantity, 0),
            createdAt: Date.now()
          }];
        }
      }

      setOrders(fetched);

      const initTimers = {};
      fetched.forEach(order => {
        const duration = order.delivery === "delivery" ? 600 : 120;
        const key = `timer_start_${order._id}`;
        const saved = localStorage.getItem(key);

        if (!saved) {
          localStorage.setItem(key, Date.now());
          initTimers[order._id] = duration;
        } else {
          const elapsed = Math.floor((Date.now() - Number(saved)) / 1000);
          initTimers[order._id] = Math.max(duration - elapsed, 0);
        }
      });
      setTimers(initTimers);
      setLoading(false);
    };

    fetchOrders();
  }, [user]);

  // Countdown + email trigger
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(id => {
          if (updated[id] > 0) {
            updated[id] -= 1;
            if (updated[id] === 0 && prev[id] === 1) {
              const order = orders.find(o => o._id === id);
              if (order && user) {
                axios.post("https://nextgenpcsbackend.onrender.com/send-order-email", {
                  userEmail: user.email,
                  orderId: id,
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

  if (loading) return <div style={{ textAlign: "center", padding: "80px", color: theme.text }}>Loading orders...</div>;
  if (orders.length === 0) return <div style={{ textAlign: "center", padding: "100px", color: theme.text }}>No orders yet</div>;

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: "100vh", padding: "30px 15px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "40px", fontSize: "36px", color: theme.text }}>Your Orders</h1>

      <div style={{ maxWidth: "1100px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "35px" }}>
        {orders.map(order => (
          <div key={order._id} style={{
            backgroundColor: theme.card,
            borderRadius: "20px",
            overflow: "hidden",
            boxShadow: "0 15px 40px rgba(0,0,0,0.3)",
            border: `2px solid ${theme.border}`
          }}>
            {/* Header */}
            <div style={{ padding: "20px", background: darkMode ? "#000" : "#f1f1f1", borderBottom: `1px solid ${theme.border}` }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h3 style={{ margin: 0, color: theme.text }}>Order #{order._id.slice(-8)}</h3>
                <span style={{ color: theme.muted }}>
                  {new Date(order.createdAt || Date.now()).toLocaleDateString()}
                </span>
              </div>
            </div>

            {/* Items Grid */}
            <div style={{ padding: "20px", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "20px" }}>
              {order.items.map((item, i) => (
                <div key={i} style={{ display: "flex", gap: "15px", background: darkMode ? "#222" : "#f9f9f9", padding: "15px", borderRadius: "12px" }}>
                  <img src={item.image_url || item.image || "/no-image.png"} alt={item.model} style={{ width: "90px", height: "90px", objectFit: "cover", borderRadius: "10px" }} />
                  <div>
                    <strong style={{ color: theme.text }}>{item.brand}</strong>
                    <p style={{ margin: "5px 0", color: theme.muted, fontSize: "14px" }}>{item.model}</p>
                    <p style={{ fontWeight: "bold" }}>R {(item.price * (item.quantity || 1)).toFixed(2)}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Instalment Progress Bar */}
            {order.paymentType === "instalment" && order.instalment && (
              <div style={{ padding: "0 20px 20px" }}>
                <div style={{ marginBottom: "10px", display: "flex", justifyContent: "space-between" }}>
                  <span style={{ fontWeight: "bold", color: theme.text }}>Instalment Progress</span>
                  <span style={{ color: theme.accent }}>
                    R{order.instalment.paid?.toFixed(2)} / R{order.totalAmount?.toFixed(2)}
                  </span>
                </div>
                <div style={{ height: "20px", background: darkMode ? "#333" : "#ddd", borderRadius: "10px", overflow: "hidden", position: "relative" }}>
                  <div style={{
                    width: `${(order.instalment.paid / order.totalAmount) * 100}%`,
                    height: "100%",
                    background: "linear-gradient(90deg, #00ff9d, #00cc7a)",
                    borderRadius: "10px",
                    transition: "width 1.5s cubic-bezier(0.4, 0, 0.2, 1)",
                    boxShadow: "0 0 20px #00ff9d88",
                  }} />
                  <div style={{
                    position: "absolute", top: 0, left: 0, width: "100%", height: "100%",
                    background: "repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(255,255,255,0.1) 10px, rgba(255,255,255,0.1) 20px)",
                    animation: "shimmer 3s linear infinite",
                  }} />
                </div>
              </div>
            )}

            {/* Timer + Map */}
            <div style={{ padding: "20px", background: darkMode ? "#0a0a0a" : "#f8f8f8" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                <span style={{ fontWeight: "bold", fontSize: "18px", color: theme.text }}>
                  {order.delivery === "delivery" ? "On the way" : "Ready for pickup"}
                </span>
                <span style={{ fontSize: "28px", fontWeight: "bold", color: timers[order._id] <= 60 ? "#ff4757" : theme.accent }}>
                  {formatTime(timers[order._id] || 0)}
                </span>
              </div>

              <div style={{ height: "340px", borderRadius: "16px", overflow: "hidden", border: `3px solid ${theme.border}` }}>
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

      <style jsx>{`
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </div>
  );
};

// REAL MOVING CAR ON DELIVERY
const DeliveryMap = ({ countdown }) => {
  const progress = Math.min(((600 - Math.max(countdown, 0)) / 600) * 100, 100);

  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0f1629", overflow: "hidden" }}>
      {/* Roads */}
      {["25%", "50%", "75%"].map(t => (
        <div key={t} style={{ position: "absolute", top: t, left: 0, width: "100%", height: "60px", background: "#1a2642", border: "2px dashed #2e3b55" }} />
      ))}
      {["20%", "40%", "60%", "80%"].map(l => (
        <div key={l} style={{ position: "absolute", top: 0, left: l, width: "60px", height: "100%", background: "#1a2642", border: "2px dashed #2e3b55" }} />
      ))}

      {/* Glowing Delivery Path */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: 0,
        width: "100%",
        height: "70px",
        background: "linear-gradient(90deg, transparent, #00ff9d44, transparent)",
        transform: "translateY(-50%)",
        boxShadow: "0 0 40px #00ff9d",
        opacity: 0.6,
      }} />

      {/* MOVING VAN */}
      <div style={{
        position: "absolute",
        left: `${progress}%`,
        top: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: "60px",
        transition: "left 0.9s cubic-bezier(0.2, 0.8, 0.4, 1)",
        filter: "drop-shadow(0 0 30px #00ff9d)",
        zIndex: 10,
      }}>
        Delivery Van
      </div>

      <div style={{ position: "absolute", left: "5%", top: "12%", color: "#00ff9d", fontSize: "22px", fontWeight: "bold" }}>🏪</div>
      <div style={{ position: "absolute", right: "5%", top: "12%", color: "#00ff9d", fontSize: "22px", fontWeight: "bold" }}>📍</div>
    </div>
  );
};

// GLOWING PATH TO STORE ON PICKUP
const PickupMap = () => {
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", background: "#0a0e1a", overflow: "hidden" }}>
      {/* Base roads */}
      {["30%", "70%"].map(t => (
        <div key={t} style={{ position: "absolute", top: t, left: 0, width: "100%", height: "80px", background: "#16213e" }} />
      ))}
      {["20%", "50%", "80%"].map(l => (
        <div key={l} style={{ position: "absolute", top: 0, left: l, width: "80px", height: "100%", background: "#16213e" }} />
      ))}

      {/* GLOWING HIGHLIGHTED PATH */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "0%",
        width: "52%",
        height: "90px",
        background: "linear-gradient(90deg, transparent 0%, #00ff9d 45%, #00ff9d 55%, transparent 100%)",
        transform: "translateY(-50%)",
        boxShadow: "0 0 60px #00ff9d, 0 0 120px #00ff9d",
        borderRadius: "50px",
        animation: "pulsePath 2.5s infinite",
      }} />

      {/* Pulsing Store */}
      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: "160px",
        height: "160px",
        background: "radial-gradient(circle, #00ff9d, transparent)",
        borderRadius: "50%",
        boxShadow: "0 0 100px #00ff9d",
        animation: "storePulse 2s infinite",
      }} />

      <div style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        color: "#fff",
        fontSize: "40px",
        fontWeight: "bold",
        textShadow: "0 0 30px #000",
        zIndex: 10,
      }}>
        🏪
      </div>

      <div style={{
        position: "absolute",
        bottom: "25px",
        left: "50%",
        transform: "translateX(-50%)",
        background: "rgba(0,255,157,0.2)",
        color: "#00ff9d",
        padding: "10px 20px",
        borderRadius: "30px",
        fontWeight: "bold",
        fontSize: "16px",
        animation: "blink 1.8s infinite",
      }}>
        Follow the glowing path
      </div>

      <style jsx>{`
        @keyframes pulsePath {
          0%, 100% { box-shadow: 0 0 60px #00ff9d, 0 0 120px #00ff9d; }
          50% { box-shadow: 0 0 90px #00ff9d, 0 0 180px #00ff9d; }
        }
        @keyframes storePulse {
          0%, 100% { transform: translate(-50%, -50%) scale(1); }
          50% { transform: translate(-50%, -50%) scale(1.2); }
        }
        @keyframes blink {
          0%, 100% { opacity: 0.7; }
          50% { opacity: 1; }
        }
      `}</style>
    </div>
  );
};

export default Orders;