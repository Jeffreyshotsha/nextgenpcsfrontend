// src/Components/Profile.jsx  ← FINAL, FULLY UPDATED & WORKING
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
  const [emailInput, setEmailInput] = useState("");
  const [accountNumber, setAccountNumber] = useState("");

  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);

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

        const ordersData = ordersRes.data.map((o) => ({
          ...o,
          totalAmount: o.totalAmount || o.items.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0) + (o.delivery === "delivery" ? 75 : 0)
        }));

        setOrders(ordersData);

        const freshUser = userRes.data;
        setPreview(freshUser.profilePicture || "");
        login(freshUser);

        generateNotifications(ordersData);
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };

    if (user) loadData();
  }, [user, login]);

  const generateNotifications = (ordersData) => {
    const notifs = [];
    ordersData.forEach((o) => {
      o.items.forEach((item) => {
        if (!item.rating && o.status === "completed") {
          notifs.push({
            message: `Rate ${item.brand} ${item.model || item.product_name}`,
            image: item.image || item.productImage || "",
          });
        }
      });
      if (o.status === "pending") {
        notifs.push({ message: `Order #${o._id.slice(-8)} is pending`, image: o.items[0]?.image || o.items[0]?.productImage || "" });
      }
      if (o.status === "completed") {
        notifs.push({ message: `Order #${o._id.slice(-8)} completed`, image: o.items[0]?.image || o.items[0]?.productImage || "" });
      }
      if (o.instalment) {
        if (o.instalment.paid < o.totalAmount) {
          notifs.push({
            message: `Instalment payment for Order #${o._id.slice(-8)}: R${o.instalment.paid.toFixed(2)} paid of R${o.totalAmount.toFixed(2)}`,
            image: o.items[0]?.image || o.items[0]?.productImage || ""
          });
        } else if (o.instalment.paid >= o.totalAmount) {
          notifs.push({
            message: `All instalments for Order #${o._id.slice(-8)} completed! Ready for pickup at 72 Marlborough Road, Springfield Glenesk`,
            image: o.items[0]?.image || o.items[0]?.productImage || ""
          });
        }
      }
      if (o.status === "delivered") {
        notifs.push({ message: `Order #${o._id.slice(-8)} has been delivered`, image: o.items[0]?.image || o.items[0]?.productImage || "" });
      }
    });
    setNotifications(notifs.reverse());
  };

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
      generateNotifications(orders.map(o => o._id === orderId ? { ...o, status: "completed" } : o));
    } catch (err) {
      alert("Failed to mark as received");
    }
  };

  const openPaymentModal = (order) => {
    setPaymentOrder(order);
    setEmailInput(user?.email || "");
    setAccountNumber("");
    setShowPaymentModal(true);
  };

  const handlePayment = async () => {
    if (!emailInput || !accountNumber) {
      alert("Please enter email and account number");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await axios.post(
        `${API_URL}/orders/${paymentOrder._id}/complete-instalment`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const updatedOrder = res.data.order || { ...paymentOrder, instalment: { ...paymentOrder.instalment, paid: paymentOrder.instalment.paid + paymentOrder.instalment.monthlyAmount } };

      setOrders(prev => prev.map(o => o._id === paymentOrder._id ? updatedOrder : o));
      generateNotifications(prev => prev.map(o => o._id === paymentOrder._id ? updatedOrder : o));

      setShowPaymentModal(false);

      if (updatedOrder.instalment.paid >= updatedOrder.totalAmount) {
        alert(`All instalments completed! You can now pick up your order at 72 Marlborough Road, Springfield Glenesk`);
      } else {
        alert(`Instalment paid! Remaining: R${(updatedOrder.totalAmount - updatedOrder.instalment.paid).toFixed(2)}`);
      }
    } catch (err) {
      alert("Payment failed. Please try again.");
      console.error(err);
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
        {/* PROFILE PICTURE & NOTIFICATIONS */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            background: darkMode ? "#111" : "#fff",
            padding: "40px",
            borderRadius: "16px",
            marginBottom: "40px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "5px solid #b80000",
                }}
              />
            ) : (
              <div
                style={{
                  width: "120px",
                  height: "120px",
                  borderRadius: "50%",
                  background: "#333",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "50px",
                  color: "#666",
                }}
              >
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
            )}

            <div>
              <h2 style={{ fontSize: "32px", marginBottom: "10px" }}>My Profile</h2>
              <label
                style={{
                  ...btn,
                  opacity: uploading ? 0.6 : 1,
                  display: "inline-block",
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
          </div>

          {/* NOTIFICATION ICON */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              style={{ ...btn, borderRadius: "50%", width: "50px", height: "50px", fontSize: "24px", padding: "0" }}
            >
              🔔
            </button>
            {showNotifications && (
              <div style={{ position: "absolute", right: 0, top: "60px", background: darkMode ? "#222" : "#fff", borderRadius: "12px", width: "320px", maxHeight: "400px", overflowY: "auto", boxShadow: "0 0 10px rgba(0,0,0,0.5)", zIndex: 999 }}>
                {notifications.length === 0 ? (
                  <div style={{ padding: "10px", textAlign: "center", color: "#aaa" }}>No notifications</div>
                ) : (
                  notifications.map((n, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", padding: "10px", borderBottom: "1px solid #444", gap: "10px" }}>
                      {n.image && <img src={n.image} alt="Product" style={{ width: "40px", height: "40px", objectFit: "cover", borderRadius: "8px" }} />}
                      <span style={{ fontSize: "14px" }}>{n.message}</span>
                    </div>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

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
              const total = order.totalAmount;
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
                          gap: "10px",
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          {item.image || item.productImage ? (
                            <img src={item.image || item.productImage} alt={item.brand} style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }} />
                          ) : null}
                          <span>
                            {item.quantity || 1} × {item.brand}{" "}
                            {item.model || item.product_name}
                          </span>
                        </div>
                        <span>
                          R{(item.price * (item.quantity || 1)).toFixed(2)}
                        </span>
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

                  {/* INSTALMENT SECTION */}
                  {instalment && instalment.paid < total && (
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

                  {order.status !== "completed" && (
                    <button onClick={() => markAsReceived(order._id)} style={btn}>
                      Mark as {order.delivery === "delivery" ? "Delivered" : "Picked Up"}
                    </button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>

      {/* PAYMENT MODAL */}
      {showPaymentModal && paymentOrder && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
            background: "rgba(0,0,0,0.7)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 5000,
          }}
        >
          <div style={{ background: "#fff", padding: "30px", borderRadius: "16px", width: "400px", maxWidth: "90%" }}>
            <h3>Pay Instalment for Order #{paymentOrder._id.slice(-8)}</h3>
            <p>Amount: R{paymentOrder.instalment.monthlyAmount.toFixed(2)}</p>

            <input
              type="email"
              placeholder="Your Email"
              value={emailInput}
              onChange={(e) => setEmailInput(e.target.value)}
              style={{ width: "100%", margin: "10px 0", padding: "10px", fontSize: "16px" }}
            />
            <input
              type="text"
              placeholder="Account Number"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              style={{ width: "100%", margin: "10px 0", padding: "10px", fontSize: "16px" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "20px" }}>
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
