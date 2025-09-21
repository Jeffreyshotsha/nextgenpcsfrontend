import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Profile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    username: "",
    email: "",
    profilePic: "",
    address: "",
    paymentMethod: { cardNumber: "", expiry: "" },
  });

  const [editData, setEditData] = useState(user);
  const [isEditingInfo, setIsEditingInfo] = useState(false);
  const [isEditingAddress, setIsEditingAddress] = useState(false);
  const [isEditingPayment, setIsEditingPayment] = useState(false);

  // Load user info from localStorage on mount
  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem("user"));
    if (savedUser) {
      setUser({
        username: savedUser.username || "",
        email: savedUser.email || "",
        profilePic: savedUser.profilePic || "",
        address: savedUser.address || "",
        paymentMethod: savedUser.paymentMethod || { cardNumber: "", expiry: "" },
      });
      setEditData({
        username: savedUser.username || "",
        email: savedUser.email || "",
        profilePic: savedUser.profilePic || "",
        address: savedUser.address || "",
        paymentMethod: savedUser.paymentMethod || { cardNumber: "", expiry: "" },
      });
    }
  }, []);

  // Save changes to localStorage
  const saveUser = (updatedUser) => {
    setUser(updatedUser);
    setEditData(updatedUser);
    localStorage.setItem("user", JSON.stringify(updatedUser));
  };

  const handleProfilePicChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const updatedUser = { ...user, profilePic: reader.result };
        saveUser(updatedUser);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveInfo = () => {
    const updatedUser = { ...user, username: editData.username, email: editData.email };
    saveUser(updatedUser);
    setIsEditingInfo(false);
  };

  const handleSaveAddress = () => {
    const updatedUser = { ...user, address: editData.address };
    saveUser(updatedUser);
    setIsEditingAddress(false);
  };

  const handleSavePayment = () => {
    const updatedUser = { ...user, paymentMethod: editData.paymentMethod };
    saveUser(updatedUser);
    setIsEditingPayment(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("Auth");
    localStorage.removeItem("user");
    navigate("/login");
  };

  return (
    <div style={{ padding: "20px", maxWidth: "600px", margin: "0 auto" }}>
      <h2 style={{ textAlign: "center", marginBottom: "20px" }}>Profile</h2>

      {/* Profile Picture */}
      <div style={{ textAlign: "center", marginBottom: "20px" }}>
        <img
          src={user.profilePic || "https://via.placeholder.com/120"}
          alt="Profile"
          style={{ width: "120px", height: "120px", borderRadius: "50%", objectFit: "cover" }}
        />
        <div style={{ marginTop: "10px" }}>
          <input type="file" accept="image/*" onChange={handleProfilePicChange} />
        </div>
      </div>

      {/* Personal Info */}
      <div style={{ background: "#fff", border: "1px solid #000", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
        <h3 style={{ marginBottom: "15px" }}>Personal Info</h3>
        {isEditingInfo ? (
          <>
            <input
              type="text"
              value={editData.username}
              onChange={(e) => setEditData({ ...editData, username: e.target.value })}
              placeholder="Enter new name"
            />
            <input
              type="email"
              value={editData.email}
              onChange={(e) => setEditData({ ...editData, email: e.target.value })}
              placeholder="Enter new email"
            />
            <button onClick={handleSaveInfo}>Save</button>
          </>
        ) : (
          <>
            <p><strong>Name:</strong> {user.username}</p>
            <p><strong>Email:</strong> {user.email}</p>
            <button onClick={() => setIsEditingInfo(true)}>Edit</button>
          </>
        )}
      </div>

      {/* Address */}
      <div style={{ background: "#fff", border: "1px solid #000", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
        <h3 style={{ marginBottom: "15px" }}>Address</h3>
        {isEditingAddress ? (
          <>
            <textarea
              value={editData.address}
              onChange={(e) => setEditData({ ...editData, address: e.target.value })}
              placeholder="Enter new address"
              rows="3"
            />
            <button onClick={handleSaveAddress}>Save</button>
          </>
        ) : (
          <>
            <p>{user.address}</p>
            <button onClick={() => setIsEditingAddress(true)}>Edit Address</button>
          </>
        )}
      </div>

      {/* Payment Method */}
      <div style={{ background: "#fff", border: "1px solid #000", borderRadius: "8px", padding: "20px", marginBottom: "20px" }}>
        <h3 style={{ marginBottom: "15px" }}>Payment Method</h3>
        {isEditingPayment ? (
          <>
            <input
              type="text"
              value={editData.paymentMethod.cardNumber}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  paymentMethod: { ...editData.paymentMethod, cardNumber: e.target.value },
                })
              }
              placeholder="Card Number"
            />
            <input
              type="text"
              value={editData.paymentMethod.expiry}
              onChange={(e) =>
                setEditData({
                  ...editData,
                  paymentMethod: { ...editData.paymentMethod, expiry: e.target.value },
                })
              }
              placeholder="Expiry Date"
            />
            <button onClick={handleSavePayment}>Save</button>
          </>
        ) : (
          <>
            <p><strong>Card:</strong> {user.paymentMethod?.cardNumber || "N/A"}</p>
            <p><strong>Expiry:</strong> {user.paymentMethod?.expiry || "N/A"}</p>
            <button onClick={() => setIsEditingPayment(true)}>Edit Payment</button>
          </>
        )}
      </div>

      {/* Logout */}
      <div style={{ textAlign: "center", marginTop: "30px" }}>
        <button
          onClick={handleLogout}
          style={{
            padding: "10px 20px",
            border: "none",
            background: "#000",
            color: "#fff",
            borderRadius: "5px",
            cursor: "pointer",
          }}
        >
          Logout
        </button>
      </div>
    </div>
  );
};

export default Profile;
