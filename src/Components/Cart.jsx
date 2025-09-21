import React, { useState, useEffect } from 'react';

const Cart = () => {
  const [cartItems, setCartItems] = useState([]);

  useEffect(() => {
    const loadCart = () => {
      const cart = JSON.parse(localStorage.getItem('cart')) || [];
      setCartItems(cart);
    };

    loadCart();

    // Listen for storage changes
    window.addEventListener('storage', loadCart);
    return () => window.removeEventListener('storage', loadCart);
  }, []);

  const handleQuantityChange = (id, delta) => {
    let cart = [...cartItems];
    const index = cart.findIndex(item => item.id === id);

    if (index !== -1) {
      cart[index].quantity += delta;

      if (cart[index].quantity <= 0) {
        cart.splice(index, 1); // remove item if quantity < 1
      }

      setCartItems(cart);
      localStorage.setItem('cart', JSON.stringify(cart));
      window.dispatchEvent(new Event('storage'));
    }
  };

  const getTotal = () => {
    return cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  };

  if (cartItems.length === 0) {
    return <div style={{ textAlign: 'center', marginTop: '50px' }}>Your cart is empty</div>;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h1 style={{ textAlign: 'center', marginBottom: '30px' }}>Shopping Cart</h1>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {cartItems.map((item) => (
          <div key={item.id} style={{
            display: 'flex',
            alignItems: 'center',
            borderBottom: '1px solid #ccc',
            padding: '10px 0'
          }}>
            <img
              src={item.image_url || item.image || "https://via.placeholder.com/100"}
              alt={item.name || item.model || "Product"}
              style={{ width: '100px', height: '100px', objectFit: 'cover', marginRight: '20px' }}
            />
            <div style={{ flex: 1 }}>
              <h3 style={{ margin: '0' }}>{item.name || "Unnamed Product"}</h3>
              <p style={{ margin: '5px 0', color: '#555' }}>{item.model || "No Model"}</p>
              <p style={{ margin: '5px 0' }}>Price: ZAR {item.price}</p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <button onClick={() => handleQuantityChange(item.id, -1)}>-</button>
              <span style={{ margin: '0 10px' }}>{item.quantity}</span>
              <button onClick={() => handleQuantityChange(item.id, 1)}>+</button>
            </div>
          </div>
        ))}

        <h2 style={{ textAlign: 'right', marginTop: '20px' }}>
          Total: ZAR {getTotal()}
        </h2>
      </div>
    </div>
  );
};

export default Cart;
