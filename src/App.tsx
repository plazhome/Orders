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
  ? 'https://orders-api.onrender.com/api'
  : 'http://localhost:3001/api';

const App: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API_URL}/products`)
      .then((res) => res.json())
      .then((data: Product[]) => {
        setProducts(data);
        setLoading(false);
      })
      .catch((error) => {
        console.error('Error fetching products:', error);
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;

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
