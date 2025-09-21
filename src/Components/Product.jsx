import React, { useState, useEffect } from 'react';
import axios from 'axios';

const Product = () => {
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedBrand, setSelectedBrand] = useState("All");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [alert, setAlert] = useState(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await axios.get('http://localhost:3000/products');
        setProducts(response.data);
        setFilteredProducts(response.data);
        setLoading(false);
      } catch (err) {
        console.error(err);
        setError('Failed to fetch products');
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Add product to cart
  const handleAddToCart = (product) => {
    const cart = JSON.parse(localStorage.getItem('cart')) || [];
    const existingIndex = cart.findIndex(item => item.id === product.id || item._id === product._id);

    if (existingIndex !== -1) {
      cart[existingIndex].quantity += 1;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    window.dispatchEvent(new Event('storage'));

    const productName = product.name || product.model || "Product";
    setAlert(`${productName} added to cart!`);
    setTimeout(() => setAlert(null), 2000);
  };

  // Filter products based on brand and category
  useEffect(() => {
    let temp = [...products];

    if (selectedBrand !== "All") {
      temp = temp.filter(p => p.brand === selectedBrand);
    }

    if (selectedCategory !== "All") {
      temp = temp.filter(p => (p.category || "").toLowerCase() === selectedCategory.toLowerCase());
    }

    setFilteredProducts(temp);
  }, [selectedBrand, selectedCategory, products]);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading products...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: '50px' }}>{error}</div>;

  // Unique brands and categories for filters
  const brands = [...new Set(products.map(p => p.brand))];
  const categories = [...new Set(products.map(p => p.category))];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* Main Content */}
      <div style={{ flex: 1, padding: '20px' }}>
        
        {alert && (
          <div style={{
            position: 'fixed', top: '20px', right: '20px',
            backgroundColor: '#000', color: '#fff', padding: '12px 20px',
            borderRadius: '8px', fontWeight: 'bold', zIndex: 1000
          }}>
            {alert}
          </div>
        )}

        <h1 style={{ textAlign: 'center', marginBottom: '20px' }}>Our Products</h1>

        {/* Filters */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '20px', marginBottom: '20px', flexWrap: 'wrap' }}>
          <div>
            <label>Brand: </label>
            <select
              value={selectedBrand}
              onChange={(e) => setSelectedBrand(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px' }}
            >
              <option value="All">All</option>
              {brands.map((brand) => (
                <option key={brand} value={brand}>{brand}</option>
              ))}
            </select>
          </div>

          <div>
            <label>Category: </label>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              style={{ padding: '6px 10px', borderRadius: '6px' }}
            >
              <option value="All">All</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Product Grid */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', justifyContent: 'center' }}>
          {filteredProducts.map((product) => (
            <div
              key={product._id || product.id}
              style={{
                border: '1px solid #000',
                borderRadius: '8px',
                width: '220px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                padding: '10px',
                height: '430px',
                boxSizing: 'border-box',
                textAlign: 'center',
                transition: 'transform 0.3s ease',
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              <img
                src={product.image_url || product.image || "https://via.placeholder.com/180"}
                alt={product.name || product.model || "Product"}
                style={{ width: '100%', height: '180px', objectFit: 'cover', borderRadius: '6px', marginBottom: '10px' }}
              />
              <div style={{ flex: 1 }}>
                <h2 style={{ margin: '5px 0', fontSize: '16px' }}>{product.brand || "Unnamed Product"}</h2>
                <h3 style={{ margin: '5px 0', fontSize: '14px', color: '#555' }}>{product.model || "No Model"}</h3>
                <p style={{ margin: '5px 0', fontSize: '14px', height: '60px', overflow: 'hidden' }}>{product.specs || "No description available"}</p>
                <p style={{ margin: '5px 0', fontWeight: 'bold' }}>Price: ZAR {product.price || "0"}</p>
              </div>
              <button
                onClick={() => handleAddToCart(product)}
                style={{
                  marginTop: '10px',
                  padding: '10px 15px',
                  backgroundColor: '#000',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold'
                }}
              >
                Add to Cart
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        backgroundColor: '#000',
        color: '#fff',
        textAlign: 'center',
        padding: '15px',
        marginTop: '20px'
      }}>
        <p style={{ margin: '5px 0' }}>© {new Date().getFullYear()} NextGenPcs. All Rights Reserved.</p>
        <p style={{ margin: '5px 0' }}>Contact: support@nextgenpcs.com | +27 123 456 789</p>
      </footer>
    </div>
  );
};

export default Product;
