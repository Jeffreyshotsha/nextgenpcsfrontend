import React, { useState, useEffect } from "react";

const Checkout = () => {
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState("credit-card");

  const [formData, setFormData] = useState({
    cardNumber: "",
    cardExpiry: "",
    cardCVV: "",
    cardHolder: "",
    paypalEmail: "",
    bankName: "",
    accountNumber: "",
    accountHolder: "",
    instalmentMonths: "3",
    instalBankName: "",
    instalAccountNumber: "",
    instalAccountHolder: "",
    instalAddress: "",
    instalPhone: "",
    instalID: "",
  });

  useEffect(() => {
    const storedCart = JSON.parse(localStorage.getItem("cart")) || [];
    setCart(storedCart);
  }, []);

  const updateCart = (updatedCart) => {
    setCart(updatedCart);
    localStorage.setItem("cart", JSON.stringify(updatedCart));
    window.dispatchEvent(new Event("storage"));
  };

  const handleIncrease = (index) => {
    const updatedCart = [...cart];
    updatedCart[index].quantity += 1;
    updateCart(updatedCart);
  };

  const handleDecrease = (index) => {
    const updatedCart = [...cart];
    if (updatedCart[index].quantity > 1) {
      updatedCart[index].quantity -= 1;
    } else {
      updatedCart.splice(index, 1);
    }
    updateCart(updatedCart);
  };

  const handleDelete = (index) => {
    const updatedCart = [...cart];
    updatedCart.splice(index, 1);
    updateCart(updatedCart);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const validateForm = () => {
    switch (paymentMethod) {
      case "credit-card":
        return (
          formData.cardNumber &&
          formData.cardExpiry &&
          formData.cardCVV &&
          formData.cardHolder
        );
      case "paypal":
        return formData.paypalEmail;
      case "eft":
        return formData.bankName && formData.accountNumber && formData.accountHolder;
      case "instalments":
        return (
          formData.instalmentMonths &&
          formData.instalBankName &&
          formData.instalAccountNumber &&
          formData.instalAccountHolder &&
          formData.instalAddress &&
          formData.instalPhone &&
          formData.instalID.length === 13
        );
      default:
        return false;
    }
  };

  const handleCheckout = async () => {
    if (!validateForm()) {
      alert(
        "Please fill all required payment fields before checkout. (ID must be 13 digits)"
      );
      return;
    }

    const order = {
      items: cart,
      total,
      paymentMethod,
      date: new Date().toISOString(),
      status: "Pending",
      paymentStatus: paymentMethod === "instalments" ? "Pending" : "Paid",
      shippingAddress: formData.instalAddress || "",
      deliveryEstimate: "",
      trackingLink: "",
    };

    try {
      const response = await fetch("http://localhost:3000/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(order),
      });
      const data = await response.json();

      if (data._id || data.insertedId || Object.keys(data).length) {
        if (paymentMethod === "instalments") {
          const perMonth = (total / Number(formData.instalmentMonths)).toFixed(2);
          alert(
            `Checkout successful!\nYou will pay in ${formData.instalmentMonths} instalments.\nEach instalment: ZAR ${perMonth}`
          );
        } else {
          alert(`Checkout successful with ${paymentMethod}!\nThank you for your purchase.`);
        }

        updateCart([]); // Clear cart after checkout
      } else {
        alert("Failed to place order. Try again.");
      }
    } catch (err) {
      console.error("Checkout failed:", err);
      alert("Failed to place order. Try again.");
    }
  };

  const renderPaymentForm = () => {
    switch (paymentMethod) {
      case "credit-card":
        return (
          <div style={centeredForm}>
            <input
              style={inputStyle}
              type="text"
              placeholder="Card Number"
              value={formData.cardNumber}
              onChange={(e) => setFormData({ ...formData, cardNumber: e.target.value })}
            />
            <input
              style={inputStyle}
              type="text"
              placeholder="Expiry (MM/YY)"
              value={formData.cardExpiry}
              onChange={(e) => setFormData({ ...formData, cardExpiry: e.target.value })}
            />
            <input
              style={inputStyle}
              type="text"
              placeholder="CVV"
              value={formData.cardCVV}
              onChange={(e) => setFormData({ ...formData, cardCVV: e.target.value })}
            />
            <input
              style={inputStyle}
              type="text"
              placeholder="Card Holder Name"
              value={formData.cardHolder}
              onChange={(e) => setFormData({ ...formData, cardHolder: e.target.value })}
            />
          </div>
        );

      case "paypal":
        return (
          <div style={centeredForm}>
            <input
              style={inputStyle}
              type="email"
              placeholder="PayPal Email"
              value={formData.paypalEmail}
              onChange={(e) => setFormData({ ...formData, paypalEmail: e.target.value })}
            />
          </div>
        );

      case "eft":
        return (
          <div style={centeredForm}>
            <input
              style={inputStyle}
              type="text"
              placeholder="Bank Name"
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
            />
            <input
              style={inputStyle}
              type="text"
              placeholder="Account Number"
              value={formData.accountNumber}
              onChange={(e) => setFormData({ ...formData, accountNumber: e.target.value })}
            />
            <input
              style={inputStyle}
              type="text"
              placeholder="Account Holder Name"
              value={formData.accountHolder}
              onChange={(e) => setFormData({ ...formData, accountHolder: e.target.value })}
            />
          </div>
        );

      case "instalments":
        const months = Number(formData.instalmentMonths || 1);
        const perMonth = total / months;
        const instalWarning =
          months <= 2 ? "⚠️ Your instalment period is very short. Make sure you can pay on time!" : "";

        return (
          <div style={centeredForm}>
            <label style={{ fontWeight: "bold" }}>Number of Instalments:</label>
            <select
              value={formData.instalmentMonths}
              onChange={(e) =>
                setFormData({ ...formData, instalmentMonths: e.target.value })
              }
              style={{ ...inputStyle, width: "100%" }}
            >
              <option value="3">3 months</option>
              <option value="6">6 months</option>
              <option value="12">12 months</option>
            </select>

            <p style={{ marginTop: "10px", fontWeight: "bold" }}>
              You will pay ZAR {perMonth.toFixed(2)} per month
            </p>

            {instalWarning && (
              <p style={{ color: "red", fontWeight: "bold" }}>{instalWarning}</p>
            )}

            <input
              style={inputStyle}
              type="text"
              placeholder="Bank Name"
              value={formData.instalBankName}
              onChange={(e) => setFormData({ ...formData, instalBankName: e.target.value })}
            />
            <input
              style={inputStyle}
              type="text"
              placeholder="Account Number"
              value={formData.instalAccountNumber}
              onChange={(e) => setFormData({ ...formData, instalAccountNumber: e.target.value })}
            />
            <input
              style={inputStyle}
              type="text"
              placeholder="Account Holder"
              value={formData.instalAccountHolder}
              onChange={(e) => setFormData({ ...formData, instalAccountHolder: e.target.value })}
            />
            <input
              style={inputStyle}
              type="text"
              placeholder="Physical Address"
              value={formData.instalAddress}
              onChange={(e) => setFormData({ ...formData, instalAddress: e.target.value })}
            />
            <input
              style={inputStyle}
              type="tel"
              placeholder="Phone Number"
              value={formData.instalPhone}
              onChange={(e) => {
                if (/^\d*$/.test(e.target.value)) {
                  setFormData({ ...formData, instalPhone: e.target.value });
                }
              }}
            />
            <input
              style={inputStyle}
              type="text"
              placeholder="ID Number (13 digits)"
              value={formData.instalID}
              onChange={(e) => {
                if (/^\d*$/.test(e.target.value)) {
                  setFormData({ ...formData, instalID: e.target.value });
                }
              }}
            />
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px" }}>Checkout</h1>

      {cart.length === 0 ? (
        <p style={{ textAlign: "center" }}>Your cart is empty</p>
      ) : (
        <>
          {/* Cart */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {cart.map((item, index) => (
              <div
                key={index}
                style={{
                  border: "1px solid #000",
                  borderRadius: "8px",
                  padding: "10px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  flexWrap: "wrap",
                }}
              >
                <img
                  src={item.image_url || item.image || "https://via.placeholder.com/80"}
                  alt={item.name || item.model}
                  style={{ width: "80px", height: "80px", objectFit: "cover", borderRadius: "6px" }}
                />
                <div style={{ flex: 1, marginLeft: "15px" }}>
                  <h3>{item.name || item.model}</h3>
                  <p>ZAR {item.price}</p>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <button onClick={() => handleDecrease(index)} style={btnStyle}>–</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => handleIncrease(index)} style={btnStyle}>+</button>
                </div>
                <button onClick={() => handleDelete(index)} style={{ ...btnStyle, backgroundColor: "red" }}>
                  Delete
                </button>
              </div>
            ))}
          </div>

          <h2 style={{ textAlign: "center", marginTop: "30px" }}>Total: ZAR {total}</h2>

          {/* Payment Method */}
          <div style={{ marginTop: "20px", textAlign: "center" }}>
            <label style={{ marginRight: "10px", fontWeight: "bold" }}>Payment Method:</label>
            <select
              value={paymentMethod}
              onChange={(e) => setPaymentMethod(e.target.value)}
              style={{ padding: "8px", borderRadius: "6px", border: "1px solid #ccc" }}
            >
              <option value="credit-card">Credit Card</option>
              <option value="paypal">PayPal</option>
              <option value="eft">EFT / Bank Account</option>
              <option value="instalments">Pay in Instalments</option>
            </select>
          </div>

          {/* Payment Form */}
          <div style={{ marginTop: "20px" }}>{renderPaymentForm()}</div>

          <div style={{ textAlign: "center", marginTop: "20px" }}>
            <button
              onClick={handleCheckout}
              style={{
                padding: "12px 20px",
                backgroundColor: "#000",
                color: "#fff",
                border: "none",
                borderRadius: "8px",
                cursor: "pointer",
                fontWeight: "bold",
              }}
            >
              Checkout
            </button>
          </div>
        </>
      )}
    </div>
  );
};

// Styles
const btnStyle = {
  padding: "8px 12px",
  backgroundColor: "#000",
  color: "#fff",
  border: "none",
  borderRadius: "6px",
  cursor: "pointer",
  fontWeight: "bold",
};

const inputStyle = {
  display: "block",
  width: "100%",
  maxWidth: "300px",
  padding: "8px",
  margin: "10px auto",
  borderRadius: "6px",
  border: "1px solid #ccc",
};

const centeredForm = { textAlign: "center", marginTop: "20px" };

export default Checkout;
