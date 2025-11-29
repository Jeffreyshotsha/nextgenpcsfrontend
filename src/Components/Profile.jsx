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

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token");
        const [ordersRes, userRes] = await Promise.all([
          axios.get(`${API_URL}/orders`, { headers: { Authorization: `Bearer ${token}` } }),
          axios.get(`${API_URL}/users/me`, { headers: { Authorization: `Bearer ${token}` } }),
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

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64 = reader.result;
      setPreview(base64);
      setUploading(true);

      try {
        const token = localStorage.getItem("token");
        await axios.put(`${API_URL}/users/profile-picture`, { image: base64 }, {
          headers: { Authorization: `Bearer ${token}` }
        });

        const updatedUser = { ...user, profilePicture: base64 };
        login(updatedUser);
        localStorage.setItem("user", JSON.stringify(updatedUser));
      } catch (err) {
        alert("Upload failed");
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const markAsReceived = async (orderId) => {
    try {
      const token = localStorage.getItem("token");
      await axios.post(`${API_URL}/orders/${orderId}/receive`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setOrders(prev => prev.map(o => o._id === orderId ? { ...o, status: "completed" } : o));
    } catch (err) {
      alert("Failed");
    }
  };

  if (loading) return <div style={{textAlign: "center", padding: "100px", color: "#fff"}}>Loading...</div>;

  return (
    <div style={{ padding: "20px", minHeight: "100vh" }}>
      <div style={{ maxWidth: "1000px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", background: "#111", padding: "40px", borderRadius: "16px", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "32px", marginBottom: "20px" }}>My Profile</h2>
          {preview ? (
            <img src={preview} alt="Profile" style={{ width: "200px", height: "200px", borderRadius: "50%", objectFit: "cover", border: "5px solid #b80000" }} />
          ) : (
            <div style={{ width: "200px", height: "200px", borderRadius: "50%", background: "#333", margin: "0 auto 20px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "80px", color: "#666" }}>
              {user?.username?.[0]?.toUpperCase() || "U"}
            </div>
          )}
          <label style={{ display: "inline-block", marginTop: "20px", padding: "12px 30px", background: "#b80000", color: "#fff", borderRadius: "8px", cursor: "pointer", fontWeight: "bold" }}>
            {uploading ? "Uploading..." : "Change Picture"}
            <input type="file" accept="image/*" onChange={handleImageChange} style={{ display: "none" }} disabled={uploading} />
          </label>
        </div>

        <div style={{ background: "#111", borderRadius: "16px", padding: "30px" }}>
          <h2 style={{ fontSize: "28px", marginBottom: "20px" }}>Your Orders ({orders.length})</h2>
          {orders.length === 0 ? <p>No orders yet.</p> : orders.map(order => {
            const total = order.items.reduce((sum, i) => sum + i.price * (i.quantity || 1), 0);

            return (
              <div key={order._id} style={{ background: "#222", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
                <strong>Order #{order._id.slice(-8)}</strong> • {new Date(order.createdAt).toLocaleDateString()}
                <br />
                Status: <span style={{ color: order.status === "completed" ? "#0f0" : "#ff9800" }}>{order.status || "pending"}</span>

                <div style={{ margin: "15px 0", padding: "15px", background: "#333", borderRadius: "8px" }}>
                  {order.items.map(item => (
                    <div key={item.id} style={{ display: "flex", alignItems: "center", margin: "15px 0", gap: "15px" }}>
                      <img 
                        src={item.image_url || item.image || "https://via.placeholder.com/70"} 
                        alt={item.product_name}
                        style={{ width: "70px", height: "70px", borderRadius: "8px", objectFit: "cover", background: "#444" }}
                      />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "bold" }}>{item.brand} {item.model || item.product_name}</div>
                        <div>Qty: {item.quantity || 1} × R{item.price.toFixed(2)}</div>
                      </div>
                    </div>
                  ))}
                  <div style={{ borderTop: "2px solid #b80000", paddingTop: "10px", fontWeight: "bold", fontSize: "18px" }}>
                    Total: R{total.toFixed(2)}
                  </div>
                </div>

                {order.status !== "completed" && (
                  <button onClick={() => markAsReceived(order._id)} style={{
                    padding: "12px 24px", background: "#b80000", color: "#fff", border: "none", borderRadius: "8px", cursor: "pointer", fontWeight: "bold"
                  }}>
                    Mark as {order.delivery === "delivery" ? "Delivered" : "Picked Up"}
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Profile;