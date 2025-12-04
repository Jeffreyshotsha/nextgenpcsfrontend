// src/Components/Checkout.jsx
import React, { useContext, useEffect, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const Checkout = ({ darkMode }) => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const cartKey = user ? `cart_${user.id}` : "cart_guest";
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(true);

  const [currency, setCurrency] = useState("ZAR");
  const currencySymbols = { ZAR: "R", USD: "$", GBP: "£", EUR: "€" };
  const conversionRates = { ZAR: 1, USD: 0.055, GBP: 0.043, EUR: 0.05 };

  const [paymentType, setPaymentType] = useState("instalment");
  const [instalmentMonths, setInstalmentMonths] = useState(3);

  const [cardInfo, setCardInfo] = useState({ number: "", expiry: "", cvv: "" });
  const [eftInfo, setEftInfo] = useState({ bank: "", accountNumber: "", holder: "" });
  const [instalmentInfo, setInstalmentInfo] = useState({
    name: "",
    email: "",
    idNumber: "",
    bankName: "",
    accountNumber: "",
  });

  const [delivery, setDelivery] = useState("pickup");
  const [deliveryInfo, setDeliveryInfo] = useState({ address: "" });

  const [showConfirmation, setShowConfirmation] = useState(false);

  const theme = {
    bg: darkMode ? "#000" : "#f5f5f5",
    cardBg: darkMode ? "#111" : "#fff",
    text: darkMode ? "#fff" : "#000",
    textMuted: darkMode ? "#ccc" : "#555",
    buttonBg: darkMode ? "#000" : "#000",
    buttonText: darkMode ? "#fff" : "#fff",
  };

  const containerStyle = {
    marginTop: "20px",
    padding: "15px",
    backgroundColor: theme.cardBg,
    borderRadius: "10px",
    maxWidth: "450px",
    margin: "20px auto",
  };

useEffect(() => {
  const stored = JSON.parse(localStorage.getItem(cartKey) || "[]") || [];
  setCart(stored);
  setLoading(false);
}, [cartKey]);


  const saveCart = (newCart) => {
    if (user) localStorage.setItem(cartKey, JSON.stringify(newCart));
    setCart(newCart);
  };

  const increaseQty = (id) => {
    const updated = cart.map((item) =>
      item.id === id ? { ...item, quantity: item.quantity + 1 } : item
    );
    saveCart(updated);
  };

  const decreaseQty = (id) => {
    const updated = cart.map((item) =>
      item.id === id ? { ...item, quantity: Math.max(1, item.quantity - 1) } : item
    );
    saveCart(updated);
  };

  const convertedPrice = (amount) =>
    (amount * conversionRates[currency]).toFixed(2);

  const totalOriginal = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const deliveryFee = delivery === "delivery" ? 75 : 0;
  const totalConverted = convertedPrice(totalOriginal + deliveryFee);
  const monthlyPayment =
    paymentType === "instalment"
      ? (totalConverted / instalmentMonths).toFixed(2)
      : null;

  const handlePurchase = async () => {
    // === ORIGINAL VALIDATION ===
    if (paymentType === "card") {
      if (
        !cardInfo.number ||
        !cardInfo.expiry ||
        !cardInfo.cvv ||
        cardInfo.number.length < 12 ||
        cardInfo.number.length > 19 ||
        cardInfo.cvv.length !== 3
      ) {
        alert("Please fill all card fields correctly");
        return;
      }
    }
    if (paymentType === "eft") {
      if (!eftInfo.bank || !eftInfo.accountNumber || !eftInfo.holder) {
        alert("Please fill all EFT fields");
        return;
      }
    }
    if (paymentType === "instalment") {
      if (
        !instalmentInfo.name ||
        !instalmentInfo.email ||
        !instalmentInfo.idNumber ||
        !instalmentInfo.bankName ||
        !instalmentInfo.accountNumber
      ) {
        alert("Please fill all instalment fields including banking details");
        return;
      }
    }
    if (delivery === "delivery" && !deliveryInfo.address) {
      alert("Please enter delivery address");
      return;
    }

    // === ORDER POSTING ===
    if (user && cart.length > 0) {
      try {
        const orderData = {
          items: cart,
          delivery,
          paymentType,
          totalAmount: totalOriginal + deliveryFee,
        };

        if (paymentType === "instalment") {
          orderData.instalment = {
            months: instalmentMonths,
            monthlyAmount: Number(monthlyPayment),
            paid: Number(monthlyPayment),
          };
        }

        await fetch("https://nextgenpcsbackend.onrender.com/orders", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(orderData),
        });

        console.log("Order posted successfully to live backend");
      } catch (err) {
        console.error("Failed to post order:", err);
      }
    }

    // === CLEAR FORMS ===
    setCart([]);
    setCardInfo({ number: "", expiry: "", cvv: "" });
    setEftInfo({ bank: "", accountNumber: "", holder: "" });
    setInstalmentInfo({ name: "", email: "", idNumber: "", bankName: "", accountNumber: "" });
    setDeliveryInfo({ address: "" });

    setShowConfirmation(true);

    localStorage.removeItem(cartKey);
    window.dispatchEvent(new Event("localStorageChanged"));
  };

  if (loading) {
    return (
      <div style={{ color: theme.text, padding: "40px", textAlign: "center" }}>
        Loading checkout…
      </div>
    );
  }

  return (
    <div style={{ backgroundColor: theme.bg, minHeight: "100vh", padding: "30px", display: "flex", justifyContent: "center" }}>
      <div style={{ width: "100%", maxWidth: "1000px", color: theme.text }}>
        {/* CONFIRMATION SCREEN */}
        {showConfirmation && (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0,0,0,0.85)", display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center", color: "#fff", zIndex: 9999,
            animation: "fadeIn 0.5s",
          }}>
            <h1 style={{ fontSize: "48px", marginBottom: "20px" }}>
              {paymentType === "instalment"
                ? "First instalment payment successful!"
                : "Purchase Complete!"}
            </h1>
            <p style={{ fontSize: "20px", marginBottom: "40px" }}>
              {paymentType === "instalment"
                ? "Thank you! Your first payment was processed. You can check your orders."
                : "Thank you for your order."}
            </p>
            <div style={{
              width: "80px", height: "80px", border: "5px solid #fff",
              borderTop: "5px solid #00C853", borderRadius: "50%",
              animation: "spin 1s linear infinite", marginBottom: "40px",
            }}></div>
            <button onClick={() => paymentType === "instalment" ? navigate("/orders") : navigate("/products")} style={{
              padding: "12px 25px", fontSize: "18px", borderRadius: "8px",
              border: "none", backgroundColor: "#00C853", color: "#fff", cursor: "pointer",
            }}>
              {paymentType === "instalment" ? "Go to Orders" : "Continue Shopping"}
            </button>
          </div>
        )}

        {cart.length > 0 && (
          <>
            <h1 style={{ textAlign: "center" }}>Checkout</h1>

            {/* PRODUCT LIST */}
            <div style={containerStyle}>
              {cart.map((item) => (
                <div key={item.id} style={{
                  display: "flex", alignItems: "center", backgroundColor: theme.cardBg,
                  padding: "15px", borderRadius: "10px", marginBottom: "15px",
                }}>
                  <img src={item.image || item.image_url || "https://via.placeholder.com/120x120/333/fff?text=NO+IMAGE"} alt={item.model}
                    style={{ width: "120px", height: "120px", borderRadius: "8px", objectFit: "cover", marginRight: "20px" }}
                  />
                  <div style={{ flexGrow: 1 }}>
                    <h3>{item.brand} {item.model}</h3>
                    <p style={{ color: theme.textMuted }}>
                      Original Price (ZAR): R {item.price.toFixed(2)}
                    </p>
                    <p>Converted: {currencySymbols[currency]} {convertedPrice(item.price)}</p>
                    <p>Qty: {item.quantity}</p>
                    <div style={{ display: "flex", gap: "10px", marginTop: "5px" }}>
                      <button onClick={() => decreaseQty(item.id)} style={qtyBtn(theme)}>-</button>
                      <button onClick={() => increaseQty(item.id)} style={qtyBtn(theme)}>+</button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* CURRENCY */}
            <div style={containerStyle}>
              <label style={{ fontWeight: "bold" }}>Choose Currency:</label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} style={selectStyle(theme, darkMode)}>
                <option value="ZAR">Rand (ZAR)</option>
                <option value="USD">Dollar (USD)</option>
                <option value="GBP">Pound (GBP)</option>
                <option value="EUR">Euro (EUR)</option>
              </select>
            </div>

            {/* PAYMENT METHOD */}
            <div style={containerStyle}>
              <label style={{ fontWeight: "bold" }}>Payment Method:</label>
              <div style={{ marginTop: "10px" }}>
                <label><input type="radio" value="instalment" checked={paymentType === "instalment"} onChange={() => setPaymentType("instalment")} /> Pay in Instalments</label><br />
                <label><input type="radio" value="card" checked={paymentType === "card"} onChange={() => setPaymentType("card")} /> Debit / Credit Card</label><br />
                <label><input type="radio" value="eft" checked={paymentType === "eft"} onChange={() => setPaymentType("eft")} /> EFT</label>
              </div>

              {/* INSTALMENT FORM */}
              {paymentType === "instalment" && (
                <div style={{ marginTop: "15px" }}>
                  <label>Months:</label>
                  <select value={instalmentMonths} onChange={(e) => setInstalmentMonths(Number(e.target.value))} style={selectStyle(theme, darkMode)}>
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months</option>
                  </select>
                  <p style={{ marginTop: "10px", color: theme.textMuted }}>
                    Monthly Payment: <strong>{currencySymbols[currency]} {monthlyPayment}</strong>
                  </p>
                  <label>Name:</label><input type="text" value={instalmentInfo.name} onChange={(e) => setInstalmentInfo({ ...instalmentInfo, name: e.target.value })} required style={inputStyle(theme)} />
                  <label>Email:</label><input type="email" value={instalmentInfo.email} onChange={(e) => setInstalmentInfo({ ...instalmentInfo, email: e.target.value })} required style={inputStyle(theme)} />
                  <label>ID Number:</label><input type="text" value={instalmentInfo.idNumber} onChange={(e) => setInstalmentInfo({ ...instalmentInfo, idNumber: e.target.value })} required style={inputStyle(theme)} />
                  <label>Bank Name:</label><input type="text" value={instalmentInfo.bankName} onChange={(e) => setInstalmentInfo({ ...instalmentInfo, bankName: e.target.value })} required style={inputStyle(theme)} />
                  <label>Account Number:</label><input type="text" value={instalmentInfo.accountNumber} onChange={(e) => setInstalmentInfo({ ...instalmentInfo, accountNumber: e.target.value })} required style={inputStyle(theme)} />
                </div>
              )}

              {/* CARD FORM */}
              {paymentType === "card" && (
                <div style={{ marginTop: "15px" }}>
                  <label>Card Number:</label><input type="text" value={cardInfo.number} maxLength={19} onChange={(e) => setCardInfo({ ...cardInfo, number: e.target.value })} required style={inputStyle(theme)} />
                  <label>Expiry (MM/YY):</label><input type="text" value={cardInfo.expiry} maxLength={5} onChange={(e) => setCardInfo({ ...cardInfo, expiry: e.target.value })} required style={inputStyle(theme)} />
                  <label>CVV:</label><input type="text" value={cardInfo.cvv} maxLength={3} onChange={(e) => setCardInfo({ ...cardInfo, cvv: e.target.value })} required style={inputStyle(theme)} />
                </div>
              )}

              {/* EFT FORM */}
              {paymentType === "eft" && (
                <div style={{ marginTop: "15px" }}>
                  <label>Bank Name:</label><input type="text" value={eftInfo.bank} onChange={(e) => setEftInfo({ ...eftInfo, bank: e.target.value })} required style={inputStyle(theme)} />
                  <label>Account Number:</label><input type="text" value={eftInfo.accountNumber} onChange={(e) => setEftInfo({ ...eftInfo, accountNumber: e.target.value })} required style={inputStyle(theme)} />
                  <label>Account Holder:</label><input type="text" value={eftInfo.holder} onChange={(e) => setEftInfo({ ...eftInfo, holder: e.target.value })} required style={inputStyle(theme)} />
                </div>
              )}
            </div>

            {/* DELIVERY */}
            <div style={containerStyle}>
              <label style={{ fontWeight: "bold" }}>Delivery Option:</label>
              <select value={delivery} onChange={(e) => setDelivery(e.target.value)} style={selectStyle(theme, darkMode)}>
                <option value="pickup">Pickup (Free)</option>
                <option value="delivery">Delivery (+R75)</option>
              </select>
              {delivery === "delivery" && (
                <div style={{ marginTop: "10px" }}>
                  <label>Address:</label>
                  <input type="text" value={deliveryInfo.address} onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })} required style={inputStyle(theme)} />
                </div>
              )}
            </div>

            {/* TOTAL */}
            <h2 style={{ textAlign: "center", marginTop: "20px" }}>
              Total: {currencySymbols[currency]} {totalConverted}
            </h2>
            <h4 style={{ textAlign: "center", color: theme.textMuted }}>
              (Original: R {totalOriginal.toFixed(2)} + Delivery: R{deliveryFee})
            </h4>

            {/* PURCHASE BUTTON */}
            <div style={{ textAlign: "center" }}>
              <button onClick={handlePurchase} style={{
                marginTop: "25px", padding: "15px 25px", backgroundColor: theme.buttonBg,
                color: theme.buttonText, border: "none", borderRadius: "8px", fontSize: "18px", cursor: "pointer",
              }}>
                Purchase
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// STYLES & ANIMATIONS
const qtyBtn = (theme) => ({
  padding: "6px 12px", backgroundColor: theme.buttonBg, color: theme.buttonText,
  borderRadius: "6px", cursor: "pointer", border: "none", fontWeight: "bold",
});

const inputStyle = (theme) => ({
  width: "100%", padding: "8px", marginTop: "5px", marginBottom: "10px",
  borderRadius: "6px", border: `1px solid ${theme.textMuted}`,
  backgroundColor: theme.bg, color: theme.text,
});

const selectStyle = (theme, darkMode) => ({
  marginTop: "5px", padding: "8px", borderRadius: "6px",
  backgroundColor: darkMode ? "#222" : "#fff", color: theme.text, width: "100%",
});

const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`@keyframes fadeIn { from {opacity:0} to {opacity:1} }`, styleSheet.cssRules.length);
styleSheet.insertRule(`@keyframes spin { 0% { transform: rotate(0deg) } 100% { transform: rotate(360deg) } }`, styleSheet.cssRules.length);

export default Checkout;
