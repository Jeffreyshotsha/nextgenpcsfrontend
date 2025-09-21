import React from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const Order = ({ order, darkMode }) => {
  const navigate = useNavigate();

  const handleViewDetails = async () => {
    try {
      const response = await axios.get(`http://localhost:3000/orders/${order._id}`);
      if (response.data) {
        // Navigate to order details page with order data
        navigate(`/orders/${order._id}`, { state: { order: response.data } });
      }
    } catch (error) {
      console.error("Failed to fetch order details:", error);
      alert("Failed to fetch order details. Please try again.");
    }
  };

  const containerStyles = {
    border: darkMode ? "2px solid #FFFF00" : "2px solid #000",
    borderRadius: "8px",
    padding: "15px",
    marginBottom: "15px",
    backgroundColor: darkMode ? "#333" : "#f9f9 f9",
    color: darkMode ? "#fff" : "#000",
    boxShadow: darkMode ? "0 2px 5px rgba(255, 255, 0, 0.9)" : "0 2px 5px rgba(0,0,0,0.1)",
  };

  const buttonStyles = {
    padding: "8px 12px",
    backgroundColor: darkMode ? "#FFFF00" : "#000",
    color: darkMode ? "#000" : "#fff",
    border: "none",
    borderRadius: "4px",
    cursor: "pointer",
    marginTop: "10px",
  };

  return (
    <div style={containerStyles}>
      <h3>Order ID: {order._id}</h3>
      <p>Date: {new Date(order.date).toLocaleDateString()}</p>
      <p>Total Amount: ${order.totalAmount.toFixed(2)}</p>
      <p>Status: {order.status}</p>
      <button style={buttonStyles} onClick={handleViewDetails}>
        View Details
      </button>
    </div>
  );
};

export default Order;                                                                      