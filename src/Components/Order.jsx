// src/pages/Orders.jsx
import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const Orders = ({ darkMode }) => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [timers, setTimers] = useState({}); // remaining seconds

  const theme = {
    bg: darkMode ? "#000" : "#f5f5f5",
    cardBg: darkMode ? "#111" : "#fff",
    text: darkMode ? "#fff" : "#000",
  };

  useEffect(() => {
    const fetchOrders = async () => {
      let fetchedOrders = [];

      if (user) {
        try {
          const token = localStorage.getItem("token");
          const response = await axios.get("https://nextgenpcsbackend.onrender.com/orders", {
            headers: { Authorization: `Bearer ${token}` },
          });
          fetchedOrders = response.data;
        } catch (err) {
          console.error("Failed to fetch user orders:", err);
        }
      } else {
        const guestCart = JSON.parse(localStorage.getItem("cart_guest") || "[]");
        if (guestCart.length) {
          fetchedOrders = [
            { _id: "guest_order", items: guestCart, delivery: "pickup" },
          ];
        }
      }

      setOrders(fetchedOrders);

      // Initialize timers
      const initTimers = {};
      fetchedOrders.forEach((order) => {
        const totalDuration = order.delivery === "delivery" ? 600 : 120; // seconds
        const savedStart = localStorage.getItem(`start_${order._id}`);
        if (!savedStart) {
          localStorage.setItem(`start_${order._id}`, Date.now());
          localStorage.setItem(`duration_${order._id}`, totalDuration);
          initTimers[order._id] = totalDuration;
        } else {
          const elapsed = Math.floor((Date.now() - Number(savedStart)) / 1000);
          const remaining = Math.max(totalDuration - elapsed, 0);
          initTimers[order._id] = remaining;
        }
      });
      setTimers(initTimers);

      setLoading(false);
    };

    fetchOrders();
  }, [user]);

  // Countdown with email trigger
  useEffect(() => {
    const interval = setInterval(() => {
      setTimers((prev) => {
        const updated = {};
        for (let id in prev) {
          const newTime = prev[id] > 0 ? prev[id] - 1 : 0;

          // ✅ Trigger email when timer reaches 0
          if (prev[id] > 0 && newTime === 0) {
            const order = orders.find((o) => o._id === id);
            if (order && user) {
              axios.post("https://nextgenpcsbackend.onrender.com/send-order-email", {
                userEmail: user.email,
                orderId: order._id,
                delivery: order.delivery,
              })
              .then(() => console.log(`Email sent for order ${id}`))
              .catch((err) => console.error("Email send failed:", err));
            }
          }

          updated[id] = newTime;
        }
        return updated;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [orders, user]);

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60).toString().padStart(2, "0");
    const s = (sec % 60).toString().padStart(2, "0");
    return `${m}:${s}`;
  };

  if (loading)
    return (
      <div style={{ textAlign: "center", padding: "40px", color: theme.text }}>
        Loading orders…
      </div>
    );

  return (
    <div
      style={{
        backgroundColor: theme.bg,
        minHeight: "100vh",
        padding: "30px",
      }}
    >
      <h1 style={{ color: theme.text, textAlign: "center" }}>Your Orders</h1>

      {orders.map((order) => (
        <div
          key={order._id}
          style={{
            margin: "20px auto",
            padding: "15px",
            backgroundColor: theme.cardBg,
            borderRadius: "10px",
            maxWidth: "900px",
          }}
        >
          <h3>Order ID: {order._id}</h3>

          {order.items.map((item, idx) => (
            <div key={idx} style={{ display: "flex", gap: "15px", marginBottom: "12px" }}>
              <img
                src={item.image_url || item.image || "/no-image.png"}
                alt={item.product_name}
                style={{ width: "100px", height: "100px", borderRadius: "8px", objectFit: "cover" }}
              />
              <div>
                <p><strong>Brand:</strong> {item.brand || item.product_name}</p>
                <p><strong>Model:</strong> {item.model || item.product_name}</p>
                {item.category && <p><strong>Category:</strong> {item.category}</p>}
                {item.specs && <p><strong>Specs:</strong> {item.specs}</p>}
                <p><strong>Price:</strong> R {item.price?.toFixed(2)}</p>
              </div>
            </div>
          ))}

          <p style={{ fontWeight: "bold" }}>Delivery Option: {order.delivery}</p>
          <p style={{ fontWeight: "bold" }}>Time Remaining: {formatTime(timers[order._id] || 0)}</p>

          <div style={{ width: "100%", height: "300px", borderRadius: "12px", overflow: "hidden", marginTop: "12px" }}>
            {order.delivery === "delivery" ? (
              <DeliveryMap countdown={timers[order._id]} orderId={order._id} />
            ) : (
              <PickupMap orderId={order._id} />
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

// Traffic Light
const TrafficLight = ({ top, left }) => (
  <div style={{ position: "absolute", top, left, width: "20px", height: "50px", backgroundColor: "#333", borderRadius: "4px", display: "flex", flexDirection: "column", justifyContent: "space-around", alignItems: "center", padding: "4px", zIndex: 10 }}>
    <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "red" }} />
    <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "yellow" }} />
    <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "green" }} />
  </div>
);

// Delivery Map
const DeliveryMap = ({ countdown }) => {
  const TOTAL = 600;
  const [progress, setProgress] = React.useState(0);
  React.useEffect(() => {
    setProgress((TOTAL - countdown) / TOTAL);
  }, [countdown]);

  const verticalRoads = ["20%", "30%", "40%", "50%", "60%", "70%", "80%"];
  const horizontalRoads = ["20%", "35%", "50%", "65%"];

  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: "#d3d3d3", position: "relative", borderRadius: "12px" }}>
      {horizontalRoads.map((top, i) => <div key={i} style={{ position: "absolute", top, left: 0, width: "100%", height: "40px", backgroundColor: "#636363", zIndex: 2 }} />)}
      {verticalRoads.map((left, i) => <div key={i} style={{ position: "absolute", top: 0, left, width: "25px", height: "100%", backgroundColor: "#555", zIndex: 3 }} />)}
      {verticalRoads.map((left, i) => <React.Fragment key={i}><TrafficLight top="35%" left={left} /><TrafficLight top="65%" left={left} /></React.Fragment>)}
      <div style={{ position: "absolute", left: `${Math.min(progress*100, 100)}%`, top: "50%", transform: "translate(-50%, -50%)", fontSize: "40px", transition: "left 1s linear", zIndex: 7 }}>🚘</div>
      <div style={{ position: "absolute", left: "5%", top: "50%", transform: "translate(-50%, -130%)", fontSize: "30px", zIndex: 6 }}>📍</div>
      <div style={{ position: "absolute", left: "95%", top: "50%", transform: "translate(-50%, -130%)", fontSize: "30px", zIndex: 6 }}>🏪</div>
    </div>
  );
};

// Pickup Map
const PickupMap = ({ orderId }) => {
  const savedProgress = localStorage.getItem(`pickup_${orderId}`);
  const [progress, setProgress] = React.useState(savedProgress ? Number(savedProgress) : 0);
  React.useEffect(() => { localStorage.setItem(`pickup_${orderId}`, progress); }, [progress, orderId]);

  return (
    <div style={{ width: "100%", height: "100%", backgroundColor: "#d3d3d3", borderRadius: "12px", position: "relative", overflow: "hidden" }}>
      {["20%", "35%", "50%", "65%"].map((top, i) => <div key={i} style={{ position: "absolute", top, left: 0, width: "100%", height: "40px", backgroundColor: "#636363", zIndex: 2 }} />)}
      {["20%", "40%", "60%", "80%"].map((left, i) => <div key={i} style={{ position: "absolute", top: 0, left, width: "25px", height: "100%", backgroundColor: "#555", zIndex: 3 }} />)}
      {["20%", "40%"].map((left, i) => <React.Fragment key={i}><TrafficLight top="10%" left={left} /><TrafficLight top="50%" left={left} /></React.Fragment>)}

      <div style={{ position: "absolute", top: "0%", left: "20%", width: "25px", height: "35%", backgroundColor: "#ffcc00", borderRadius: "4px", zIndex: 8, boxShadow: "0 0 8px #ffcc00" }} />
      <div style={{ position: "absolute", top: "35%", left: "20%", width: "75%", height: "8px", backgroundColor: "#ffcc00", borderRadius: "4px", zIndex: 8, boxShadow: "0 0 8px #ffcc00" }} />

      <div style={{ position: "absolute", left: "20%", top: "0%", transform: "translate(-50%, -130%)", fontSize: "30px", zIndex: 9 }}>📍</div>
      <div style={{ position: "absolute", left: "95%", top: "35%", transform: "translate(-50%, -130%)", fontSize: "36px", color: "#ffcc00", textShadow: "0 0 8px #ffcc00", zIndex: 10 }}>🏪</div>
    </div>
  );
};

export default Orders;
