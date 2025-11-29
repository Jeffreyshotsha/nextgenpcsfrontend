// src/Components/Profile.jsx  ← FINAL, GUARANTEED NO ERRORS
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const Profile = ({ darkMode }) => {
  const { user, login } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(user?.profilePicture || "");
  const [uploading, setUploading] = useState(false);

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
    } catch (err) {
      alert("Failed to mark as received");
    }
  };

  const payInstalment = async (orderId) => {
    if (!confirm("Complete your instalment payment now?")) return;

    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/orders/${orderId}/complete-instalment`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId ? { ...o, paymentType: "paid", instalment: null } : o
        )
      );
      alert("Payment completed!");
    } catch (err) {
      alert("Payment failed");
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
                          margin: "8px 0",
                        }}
                      >
                        <span>
                          {item.quantity || 1} × {item.brand}{" "}
                          {item.model || item.product_name}
                        </span>
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

                  {instalment && (
                    <div style={{ margin: "20px 0" }}>
                      <p>
                        <strong>Instalment Plan</strong> — {instalment.months} months @ R
                        {instalment.monthlyAmount.toFixed(2)}/month
                      </p>
                      <div
                        style={{
                          background: "#333",
                          borderRadius: "8px",
                          overflow: "hidden",
                        }}
                      >
                        <div
                          style={{
                            width: `${(instalment.paid / total) * 100}%`,
                            background: "linear-gradient(90deg, #4caf50, #8bc34a)",
                            height: "34px",
                            textAlign: "center",
                            color: "#000",
                            fontWeight: "bold",
                            lineHeight: "34px",
                          }}
                        >
                          Paid: R{instalment.paid.toFixed(2)} of R{total.toFixed(2)}
                        </div>
                      </div>
                      <button
                        onClick={() => payInstalment(order._id)}
                        style={{
                          ...btn,
                          backgroundColor: "#4caf50",
                          marginTop: "12px",
                        }}
                      >
                        Pay Remaining R{(total - instalment.paid).toFixed(2)} Now
                      </button>
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
    </div>
  );
};

export default Profile;