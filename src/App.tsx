import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ProductListing } from './components/ProductListing/ProductListing';
import { ProductPage } from './components/ProductPage/ProductPage';
import { Navigation } from './components/Navigation/Navigation';
import { Product } from './types/product';
import { CartProvider } from './context/CartContext';
import { AdminProvider } from './context/AdminContext';
import { AdminLogin } from './components/Admin/AdminLogin';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { Cart } from './components/Cart/Cart';
import './App.scss';

// API URL based on environment
const API_URL = import.meta.env.PROD 
  ? 'https://orders-api-431y.onrender.com/api'
  : 'http://localhost:3001/api';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAPI = async () => {
      try {
        // First check if API is running
        const healthCheck = await fetch(`${API_URL}`);
        if (!healthCheck.ok) throw new Error('API is starting up...');

        // Then fetch products
        const response = await fetch(`${API_URL}/products`);
        if (!response.ok) throw new Error('Failed to fetch products');
        
        const data = await response.json();
        setProducts(data);
        setError(null);
      } catch (error) {
        console.error('Error:', error);
        setError(error instanceof Error ? error.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    checkAPI();
  }, []);

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Please wait while the server starts up...</p>
        <p className="loading-note">This may take up to 60 seconds on the first load.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <AdminProvider>
      <CartProvider>
        <Router>
          <div className="app">
            <Navigation />
            <main className="main-content">
              <Routes>
                <Route 
                  path="/" 
                  element={<ProductListing products={products} />} 
                />
                <Route 
                  path="/product/:productId" 
                  element={<ProductPage products={products} />} 
                />
                <Route 
                  path="/admin"
                  element={<AdminLogin />} 
                />
                <Route 
                  path="/admin/dashboard"
                  element={<AdminDashboard />} 
                />
                <Route 
                  path="/cart"
                  element={<Cart />} 
                />
                <Route 
                  path="*" 
                  element={<Navigate to="/" replace />} 
                />
              </Routes>
            </main>
          </div>
        </Router>
      </CartProvider>
    </AdminProvider>
  );
};

export default App;
