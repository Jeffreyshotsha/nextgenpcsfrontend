// src/Components/Product.jsx
import React, { useState, useEffect, useContext } from 'react';
import axios from 'axios';
import { AuthContext } from '../context/AuthContext';

const Product = ({ darkMode }) => {  // ← Receive darkMode from App
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000';

  // Theme based on Navbar's darkMode
  const theme = {
    bg: darkMode ? '#000' : '#fff',
    cardBg: darkMode ? '#111' : '#fff',
    text: darkMode ? '#fff' : '#000',
    textMuted: darkMode ? '#aaa' : '#666',
    border: darkMode ? '#fff' : '#000',
    buttonBg: darkMode ? '#fff' : '#000',
    buttonText: darkMode ? '#000' : '#fff',
    alertBg: darkMode ? '#fff' : '#000',
    alertText: darkMode ? '#000' : '#fff',
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get(`${apiBase}/products`);
        setProducts(response.data);
        setFilteredProducts(response.data);
        setLoading(false);
      } catch (err) {
        setError('Failed to fetch products. Is backend running?');
        setLoading(false);
      }
    };
    fetchProducts();
  }, [apiBase]);

  const handleAddToCart = (product) => {
    if (!user) {
      alert("Please log in to add items to the cart.");
      return;
    }
    if (!product) return;

    const cartKey = `cart_${user.id}`;
    let cart = JSON.parse(localStorage.getItem(cartKey)) || [];

    const productId = product._id
      ? String(product._id)
      : `${product.brand || 'unknown'}-${product.model || product.name || 'item'}`;

    const cartItem = {
      id: productId,
      brand: product.brand || "Unknown Brand",
      model: product.model || product.name || "Unknown Model",
      price: Number(product.price) || 0,
      image: product.image_url || product.image || "https://via.placeholder.com/180",
      quantity: 1,
    };

    const existingIndex = cart.findIndex(item => item.id === productId);
    if (existingIndex !== -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push(cartItem);
    }

    localStorage.setItem(cartKey, JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));

    setAlert(`${cartItem.brand} ${cartItem.model} added to cart!`);
    setTimeout(() => setAlert(null), 3000);
  };

  useEffect(() => {
    let filtered = [...products];
    if (selectedBrand !== "All") filtered = filtered.filter(p => p.brand === selectedBrand);
    if (selectedCategory !== "All") {
      filtered = filtered.filter(p => String(p.category || "").toLowerCase() === selectedCategory.toLowerCase());
    }
    setFilteredProducts(filtered);
  }, [selectedBrand, selectedCategory, products]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px', color: theme.text }}>Loading products...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>{error}</div>;

  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];
  const categories = [...new Set(products.map(p => p.category).filter(Boolean))];

  const handleBack = () => setSelectedProduct(null);

  // PRODUCT DETAIL VIEW
  if (selectedProduct) {
    return (
      <div style={{ padding: '20px', minHeight: '100vh', backgroundColor: theme.bg, color: theme.text }}>
        <button onClick={handleBack} style={{
          marginBottom: '20px', padding: '8px 12px',
          backgroundColor: theme.buttonBg, color: theme.buttonText,
          border: 'none', borderRadius: '6px', cursor: 'pointer'
        }}>
          ← Back to Products
        </button>

        {alert && (
          <div style={{
            position: 'fixed', top: '20px', right: '20px',
            backgroundColor: theme.alertBg, color: theme.alertText,
            padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', zIndex: 1000
          }}>
            {alert}
          </div>
        )}

        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '30px', justifyContent: 'center' }}>
          <div style={{ maxWidth: '300px' }}>
            <img
              src={selectedProduct.image_url || selectedProduct.image || "https://via.placeholder.com/300"}
              alt={selectedProduct.model}
              style={{ width: '100%', borderRadius: '8px', border: `2px solid ${theme.border}` }}
            />
          </div>
          <div style={{ maxWidth: '500px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '10px' }}>
              {selectedProduct.brand || "Unknown Brand"}
            </h2>
            <p style={{ fontSize: '18px', color: theme.textMuted, marginBottom: '10px' }}>
              Model: {selectedProduct.model || selectedProduct.name || "Unknown Model"}
            </p>
            <p>Category: {selectedProduct.category || "No Category"}</p>
            <p>Specs: {selectedProduct.specs || "No specs available"}</p>
            <p>Description: {selectedProduct.description || "No description available"}</p>
            <p style={{ fontWeight: 'bold', fontSize: '18px', margin: '20px 0' }}>
              Price: ZAR {selectedProduct.price || "0"}
            </p>
            <button
              onClick={() => handleAddToCart(selectedProduct)}
              style={{
                padding: '12px 18px', backgroundColor: theme.buttonBg,
                color: theme.buttonText, border: 'none', borderRadius: '8px',
                cursor: 'pointer', fontWeight: 'bold'
              }}
            >
              Add to Cart
            </button>
          </div>
        </div>
      </div>
    );
  }

  // PRODUCT GRID VIEW
  return (
    <div style={{ backgroundColor: theme.bg, color: theme.text, minHeight: '100vh' }}>
      {alert && (
        <div style={{
          position: 'fixed', top: '20px', right: '20px',
          backgroundColor: theme.alertBg, color: theme.alertText,
          padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', zIndex: 1000
        }}>
          {alert}
        </div>
      )}

      <h1 style={{ textAlign: 'center', margin: '60px 0 30px', fontSize: '32px' }}>Our Products</h1>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '30px', flexWrap: 'wrap' }}>
        <div>
          <label>Brand: </label>
          <select value={selectedBrand} onChange={(e) => setSelectedBrand(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', background: theme.buttonBg, color: theme.buttonText }}>
            <option value="All">All</option>
            {brands.map(brand => <option key={brand} value={brand}>{brand}</option>)}
          </select>
        </div>
        <div>
          <label>Category: </label>
          <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}
            style={{ padding: '6px 10px', borderRadius: '6px', background: theme.buttonBg, color: theme.buttonText }}>
            <option value="All">All</option>
            {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
          </select>
        </div>
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center', padding: '0 20px 40px' }}>
        {filteredProducts.map((product) => {
          const key = product._id || product.id || `${product.brand}_${product.model}`;

          return (
            <div
              key={key}
              onClick={() => setSelectedProduct(product)}
              style={{
                border: `2px solid ${theme.border}`,
                borderRadius: '8px',
                width: '220px',
                padding: '10px',
                height: '430px',
                boxSizing: 'border-box',
                textAlign: 'center',
                backgroundColor: theme.cardBg,
                cursor: 'pointer',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img
                src={product.image_url || product.image || "https://via.placeholder.com/180"}
                alt={product.model}
                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }}
              />
              <h2 style={{ margin: '5px 0', fontSize: '16px', fontWeight: 'bold' }}>
                {product.brand || "Unknown Brand"}
              </h2>
              <h3 style={{ margin: '3px 0', fontSize: '14px', color: theme.textMuted }}>
                {product.model || product.name || "Unknown Model"}
              </h3>
              <p style={{ margin: '5px 0', fontSize: '14px', height: '60px', overflow: 'hidden' }}>
                {product.specs || "No description available"}
              </p>
              <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Price: ZAR {product.price || "0"}</p>

              <button
                onClick={(e) => { e.stopPropagation(); handleAddToCart(product); }}
                style={{
                  marginTop: '10px',
                  padding: '10px 15px',
                  backgroundColor: theme.buttonBg,
                  color: theme.buttonText,
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Add to Cart
              </button>
            </div>
          );
        })}
      </div>

      <footer style={{
        backgroundColor: theme.bg,
        color: theme.textMuted,
        textAlign: 'center',
        padding: '20px',
        borderTop: `1px solid ${darkMode ? '#333' : '#ddd'}`
      }}>
        <p>© {new Date().getFullYear()} NextGenPcs. All Rights Reserved.</p>
        <p>Contact: support@nextgenpcs.com | +27 123 456 789</p>
      </footer>
    </div>
  );
};

export default Product;