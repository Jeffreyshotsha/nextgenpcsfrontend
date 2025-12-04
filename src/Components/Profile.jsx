// src/Components/Profile.jsx  ← UPDATED WITH PAYMENT MODAL, IMAGES & NOTIFICATIONS
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const Profile = ({ darkMode }) => {
  const { user, login } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(user?.profilePicture || "");
  const [uploading, setUploading] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentOrder, setPaymentOrder] = useState(null);
  const [accountNumber, setAccountNumber] = useState("");
  const [emailInput, setEmailInput] = useState("");
  const [notifications, setNotifications] = useState([]);

  const API_URL = "https://nextgenpcsbackend.onrender.com";

  const btn = {
    padding: "12px 24px",
    backgroundColor: "#b80000",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    margin: "8px 4px",
  };

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [ordersRes, userRes] = await Promise.all([
          axios.get(`${API_URL}/orders`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          axios.get(`${API_URL}/users/me`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        setOrders(ordersRes.data);
        const freshUser = userRes.data;
        setPreview(freshUser.profilePicture || "");
        login(freshUser);

        // Generate notifications based on orders
        const notes = [];
        ordersRes.data.forEach((o) => {
          if (o.status !== "completed") notes.push(`Order #${o._id.slice(-8)} is in progress`);
          if (o.instalment && o.instalment.paid < o.total)
            notes.push(`Order #${o._id.slice(-8)} has an instalment pending: R${(o.total - o.instalment.paid).toFixed(2)} remaining`);
          if (o.status === "completed" && !o.instalment) notes.push(`Order #${o._id.slice(-8)} is ready for pickup at 72 Marlborough Road, Springfield Glenesk`);
        });
        setNotifications(notes);
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadData();
  }, [user, login]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 1.5 * 1024 * 1024) {
      alert("Image too big! Max 1.5MB");
      return;
    }

    const reader = new FileReader();
    reader.onloadend = async () => {
      let base64 = reader.result;

      if (file.size > 500 * 1024) {
        base64 = await compressImage(file);
      }

      setPreview(base64);
      setUploading(true);

      try {
        const token = localStorage.getItem("token");
        await axios.put(
          `${API_URL}/users/profile-picture`,
          { image: base64 },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const updatedUser = { ...user, profilePicture: base64 };
        login(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
        alert("Profile picture updated!");
      } catch (err) {
        alert("Upload failed — try a smaller image");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const compressImage = (file) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        let width = img.width;
        let height = img.height;
        const max = 800;

        if (width > max || height > max) {
          if (width > height) {
            height = Math.round((height * max) / width);
            width = max;
          } else {
            width = Math.round((width * max) / height);
            height = max;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL("image/jpeg", 0.8));
      };
      img.src = URL.createObjectURL(file);
    });
  };

  const markAsReceived = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/orders/${orderId}/receive`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: "completed" } : o))
      );
      alert(`Order #${orderId.slice(-8)} marked as received.`);
    } catch (err) {
      alert("Failed to mark as received");
    }
  };

  const openPaymentModal = (order) => {
    setPaymentOrder(order);
    setEmailInput(user.email);
    setAccountNumber("");
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!emailInput || !accountNumber) {
      alert("Please fill in all fields");
      return;
    }
    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/orders/${paymentOrder._id}/complete-instalment`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Update order
      setOrders((prev) =>
        prev.map((o) =>
          o._id === paymentOrder._id ? res.data.order || o : o
        )
      );

      const orderPaid = res.data.order;
      const total = orderPaid.total;
      const paid = orderPaid.instalment?.paid || total;
      const remaining = Math.max(total - paid, 0);

      if (remaining > 0) {
        alert(`Payment successful! R${paid.toFixed(2)} paid. R${remaining.toFixed(2)} remaining.`);
      } else {
        alert(`Congratulations! You have fully paid your order. You can now pick it up at 72 Marlborough Road, Springfield Glenesk.`);
      }

      setShowPaymentModal(false);
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Payment failed. Please try again.");
    }
  };

  const rateItem = async (orderId, itemId, stars) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${API_URL}/orders/${orderId}/rate/${itemId}`,
        { rating: stars },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? {
                ...o,
                items: o.items.map((i) =>
                  i.id === itemId ? { ...i, rating: stars } : i
                ),
              }
            : o
        )
      );
    } catch (err) {
      alert("Rating failed");
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "120px", color: "#fff", fontSize: "24px" }}>
        Loading your profile...
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", padding: "20px" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>

        {/* PROFILE PICTURE */}
        <div
          style={{
            textAlign: "center",
            background: darkMode ? "#111" : "#fff",
            padding: "40px",
            borderRadius: "16px",
            marginBottom: "40px",
          }}
        >
          <h2 style={{ fontSize: "32px", marginBottom: "20px" }}>My Profile</h2>

          {preview ? (
            <img
              src={preview}
              alt="Profile"
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                objectFit: "cover",
                border: "5px solid #b80000",
              }}
            />
          ) : (
            <div
              style={{
                width: "200px",
                height: "200px",
                borderRadius: "50%",
                background: "#333",
                margin: "0 auto 20px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "80px",
                color: "#666",
              }}
            >
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
          )}

          <label
            style={{
              ...btn,
              opacity: uploading ? 0.6 : 1,
              display: "inline-block",
              marginTop: "20px",
            }}
          >
            {uploading ? "Uploading..." : "Change Picture"}
            <input
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              style={{ display: "none" }}
              disabled={uploading}
            />
          </label>
        </div>

        {/* NOTIFICATIONS */}
        {notifications.length > 0 && (
          <div style={{ background: darkMode ? "#222" : "#f9f9f9", padding: "20px", borderRadius: "12px", marginBottom: "30px" }}>
            <h3>Notifications</h3>
            <ul>
              {notifications.map((n, idx) => (
                <li key={idx} style={{ marginBottom: "6px", color: darkMode ? "#ccc" : "#333" }}>{n}</li>
              ))}
            </ul>
          </div>
        )}

        {/* ORDERS */}
        <div
          style={{
            background: darkMode ? "#111" : "#fff",
            borderRadius: "16px",
            padding: "30px",
          }}
        >
          <h2 style={{ fontSize: "28px", marginBottom: "20px" }}>
            Your Orders ({orders.length})
          </h2>

          {orders.length === 0 ? (
            <p style={{ textAlign: "center", color: "#aaa", fontSize: "20px" }}>
              No orders yet.
            </p>
          ) : (
            orders.map((order) => {
              const total = order.items.reduce(
                (sum, i) => sum + i.price * (i.quantity || 1),
                0
              );
              const instalment = order.instalment;

              return (
                <div
                  key={order._id}
                  style={{
                    border: "1px solid #444",
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "25px",
                  }}
                >
                  <strong>Order #{order._id.slice(-8)}</strong> •{" "}
                  {new Date(order.createdAt).toLocaleDateString()}
                  <br />
                  Status:{" "}
                  <span
                    style={{
                      color: order.status === "completed" ? "lime" : "#ff9800",
                      fontWeight: "bold",
                    }}
                  >
                    {order.status || "pending"}
                  </span>

                  <div
                    style={{
                      margin: "15px 0",
                      padding: "15px",
                      background: darkMode ? "#222" : "#f0f0f0",
                      borderRadius: "8px",
                    }}
                  >
                    <strong>Order Summary:</strong>
                    {order.items.map((item) => (
                      <div
                        key={item.id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "center",
                          margin: "8px 0",
                        }}
                      >
                        <span>
                          {item.quantity || 1} × {item.brand}{" "}
                          {item.model || item.product_name}
                        </span>
                        <span>R{(item.price * (item.quantity || 1)).toFixed(2)}</span>
                        {item.image && (
                          <img
                            src={item.image}
                            alt={item.model || item.product_name}
                            style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "6px" }}
                          />
                        )}
                      </div>
                    ))}
                    <div
                      style={{
                        borderTop: "2px solid #b80000",
                        paddingTop: "10px",
                        fontWeight: "bold",
                        fontSize: "18px",
                      }}
                    >
                      Total: R{total.toFixed(2)}
                    </div>
                  </div>

                  {/* INSTALMENT */}
                  {instalment && (
                    <div style={{ margin: "20px 0", padding: "15px", background: darkMode ? "#222" : "#f9f9f9", borderRadius: "12px" }}>
                      <p style={{ margin: "0 0 10px", fontSize: "18px" }}>
                        <strong>Instalment Plan Active</strong>
                      </p>
                      <p style={{ margin: "5px 0", color: "#aaa" }}>
                        {instalment.months}-month plan • Monthly payment: <strong style={{ color: "#b80000" }}>R{instalment.monthlyAmount.toFixed(2)}</strong>
                      </p>

                      <div style={{ margin: "15px 0" }}>
                        <div style={{ background: "#333", borderRadius: "8px", overflow: "hidden", height: "38px" }}>
                          <div
                            style={{
                              width: `${Math.min((instalment.paid / total) * 100, 100)}%`,
                              background: instalment.paid >= total ? "#4caf50" : "linear-gradient(90deg, #ff9800, #ffc107)",
                              height: "100%",
                              textAlign: "center",
                              color: "#000",
                              fontWeight: "bold",
                              fontSize: "16px",
                              lineHeight: "38px",
                              transition: "width 0.4s ease",
                            }}
                          >
                            {instalment.paid >= total 
                              ? "PAID IN FULL!" 
                              : `R${instalment.paid.toFixed(2)} of R${total.toFixed(2)} paid`
                            }
                          </div>
                        </div>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "10px", fontSize: "15px" }}>
                        <span>Paid so far: <strong>R{instalment.paid.toFixed(2)}</strong></span>
                        <span>Remaining: <strong style={{ color: "#b80000" }}>R{(total - instalment.paid).toFixed(2)}</strong></span>
                        <span>Payments made: <strong>{instalment.paymentsMade || Math.floor(instalment.paid / instalment.monthlyAmount)}</strong> / {instalment.months}</span>
                      </div>

                      {instalment.paid < total && (
                        <button
                          onClick={() => openPaymentModal(order)}
                          style={{
                            ...btn,
                            backgroundColor: "#4caf50",
                            marginTop: "15px",
                            fontSize: "16px",
                            padding: "14px 28px",
                          }}
                        >
                          Pay Next Instalment • R{instalment.monthlyAmount.toFixed(2)}
                        </button>
                      )}

                      {instalment.paid >= total && (
                        <div style={{ color: "#4caf50", fontWeight: "bold", fontSize: "18px", marginTop: "10px" }}>
                          All instalments completed!
                        </div>
                      )}
                    </div>
                  )}

                  {order.status !== "completed" && (
                    <button onClick={() => markAsReceived(order._id)} style={btn}>
                      Mark as {order.delivery === "delivery" ? "Delivered" : "Picked Up"}
                    </button>
                  )}

                  {order.status === "completed" &&
                    order.items.map((item) =>
                      !item.rating ? (
                        <div key={`rate-${item.id}`} style={{ marginTop: "15px" }}>
                          Rate {item.brand} {item.model || item.product_name}:
                          {[5, 4, 3, 2, 1].map((n) => (
                            <button
                              key={n}
                              onClick={() => rateItem(order._id, item.id, n)}
                              style={{
                                margin: "0 6px",
                                padding: "8px 14px",
                                background: "#b80000",
                                color: "#fff",
                                border: "none",
                                borderRadius: "6px",
                              }}
                            >
                              {n} Star
                            </button>
                          ))}
                        </div>
                      ) : (
                        <div key={`rated-${item.id}`} style={{ marginTop: "10px", color: "#0f0" }}>
                          You rated {item.brand}: {item.rating} stars
                        </div>
                      )
                    )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && paymentOrder && (
        <div style={{
          position: "fixed",
          top: 0, left: 0,
          width: "100%", height: "100%",
          backgroundColor: "rgba(0,0,0,0.7)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000
        }}>
          <div style={{
            background: darkMode ? "#222" : "#fff",
            padding: "30px",
            borderRadius: "12px",
            width: "400px",
            boxShadow: "0 0 15px rgba(0,0,0,0.5)"
          }}>
            <h3>Pay Instalment</h3>
            <p>Amount: <strong>R{paymentOrder.instalment.monthlyAmount.toFixed(2)}</strong></p>
            <div style={{ marginBottom: "10px" }}>
              <label>Email:</label>
              <input
                type="email"
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              />
            </div>
            <div style={{ marginBottom: "10px" }}>
              <label>Account Number:</label>
              <input
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                style={{ width: "100%", padding: "8px", marginTop: "4px" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setShowPaymentModal(false)} style={{ ...btn, backgroundColor: "#888" }}>Cancel</button>
              <button onClick={handlePayment} style={{ ...btn, backgroundColor: "#4caf50" }}>Confirm Payment</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Profile;
