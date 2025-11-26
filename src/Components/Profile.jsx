// src/Components/Profile.jsx   (or src/pages/Profile.jsx)
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";

const Profile = ({ darkMode }) => {
  const { user, login } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [preview, setPreview] = useState(user?.profilePicture || "");
  const [uploading, setUploading] = useState(false);

  const api = import.meta.env.VITE_API_URL || "http://localhost:3000";

  const btn = {
    padding: "10px 20px",
    backgroundColor: "#000",
    color: "#fff",
    border: "none",
    borderRadius: "8px",
    cursor: "pointer",
    fontWeight: "bold",
    margin: "5px",
  };

  // Load orders + fresh user data (including latest profile picture)
  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [ordersRes, userRes] = await Promise.all([
          axios.get(`${api}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${api}/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
        ]);

        setOrders(ordersRes.data);
        const freshUser = userRes.data;
        setPreview(freshUser.profilePicture || "");
        login(freshUser);
        localStorage.setItem("user", JSON.stringify(freshUser));
      } catch (err) {
        console.error("Load error:", err);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, [api, login]);

  // ONE BUTTON: Select + Upload instantly
  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setPreview(base64);
      setUploading(true);

      try {
        const token = localStorage.getItem("token");
        await axios.put(
          `${api}/users/profile-picture`,
          { image: base64 },
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const updatedUser = { ...user, profilePicture: base64 };
        login(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (err) {
        alert("Upload failed");
        console.error(err);
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  // Mark as received
  const markAsReceived = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${api}/orders/${orderId}/receive`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setOrders((prev) =>
        prev.map((o) =>
          o._id === orderId
            ? { ...o, status: "completed", completionDate: new Date().toISOString() }
            : o
        )
      );
    } catch (err) {
      alert("Failed to mark as received");
      console.error(err);
    }
  };

  // Rate item
  const rateItem = async (orderId, itemId, stars) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(
        `${api}/orders/${orderId}/rate/${itemId}`,
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
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "60px", color: darkMode ? "#fff" : "#000" }}>
        Loading profile...
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: darkMode ? "#000" : "#f5f5f5",
        color: darkMode ? "#fff" : "#000",
        padding: "20px",
      }}
    >
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>

        {/* PROFILE PICTURE – ONE BUTTON ONLY */}
        <div
          style={{
            textAlign: "center",
            background: darkMode ? "#111" : "#fff",
            padding: "30px",
            borderRadius: "12px",
            marginBottom: "40px",
          }}
        >
          <h2>My Profile</h2>

          <div style={{ margin: "25px 0" }}>
            {preview ? (
              <img
                src={preview}
                alt="Profile"
                style={{
                  width: "180px",
                  height: "180px",
                  borderRadius: "50%",
                  objectFit: "cover",
                  border: "5px solid #333",
                }}
              />
            ) : (
              <div
                style={{
                  width: "180px",
                  height: "180px",
                  borderRadius: "50%",
                  background: "#444",
                  margin: "0 auto",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "70px",
                  color: "#aaa",
                }}
              >
                {user?.username?.[0]?.toUpperCase() || "U"}
              </div>
            )}
          </div>

          <label style={{ ...btn, opacity: uploading ? 0.6 : 1 }}>
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
            borderRadius: "12px",
            padding: "20px",
          }}
        >
          <h2>Your Orders ({orders.length})</h2>

          {orders.length === 0 ? (
            <p>No orders yet.</p>
          ) : (
            orders.map((order) => (
              <div
                key={order._id}
                style={{
                  border: "1px solid #444",
                  borderRadius: "10px",
                  padding: "15px",
                  marginBottom: "15px",
                }}
              >
                <strong>Order #{order._id.slice(-8)}</strong> •{" "}
                {new Date(order.createdAt).toLocaleDateString()}
                <br />
                Status:{" "}
                <span style={{ color: order.status === "completed" ? "green" : "orange" }}>
                  {order.status || "pending"}
                </span>

                {order.status !== "completed" && (
                  <button onClick={() => markAsReceived(order._id)} style={btn}>
                    Mark as {order.delivery === "delivery" ? "Delivered" : "Picked Up"}
                  </button>
                )}

                {order.items.map((item) => (
                  <div
                    key={item.id}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: "15px",
                      paddingTop: "10px",
                      borderTop: "1px solid #555",
                    }}
                  >
                    <img
                      src={item.image_url || "/no-image.png"}
                      alt={item.product_name}
                      style={{
                        width: "70px",
                        height: "70px",
                        objectFit: "cover",
                        borderRadius: "8px",
                        marginRight: "15px",
                      }}
                    />
                    <div style={{ flex: 1 }}>
                      <div>
                        <strong>{item.brand} {item.model || item.product_name}</strong>
                      </div>
                      <div>Qty: {item.quantity} × R{item.price}</div>

                      {order.status === "completed" && !item.rating && (
                        <div style={{ marginTop: "8px" }}>
                          Rate:
                          {[5, 4, 3, 2, 1].map((n) => (
                            <button
                              key={n}
                              onClick={() => rateItem(order._id, item.id, n)}
                              style={{ ...btn, fontSize: "12px", padding: "5px 10px" }}
                            >
                              {n} star
                            </button>
                          ))}
                        </div>
                      )}
                      {item.rating && <div>You rated: {item.rating} stars</div>}
                    </div>
                  </div>
                ))}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;