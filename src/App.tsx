import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProductListing } from './components/ProductListing/ProductListing';
import { ProductPage } from './components/ProductPage/ProductPage';
import { Navigation } from './components/Navigation/Navigation';
import { Product } from './types/product';
import { CartProvider } from './context/CartContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { AdminLogin } from './components/Admin/AdminLogin';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { Cart } from './components/Cart/Cart';
import './App.scss';

// API URL based on environment
const API_URL = import.meta.env.PROD 
  ? 'https://orders-app-431y.onrender.com/api'
  : 'http://localhost:3001/api';

// Protected route component
interface ProtectedRouteProps {
  children: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAdmin } = useAdmin();
  const location = useLocation();

  if (!isAdmin) {
    return <Navigate to="/admin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

const AppContent: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProducts = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/products`);
      if (!response.ok) {
        throw new Error('Failed to fetch products');
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
      setError('Failed to fetch products. Please try again later.');
    }
  }, []);

  // Check API health and fetch products
  const checkAPI = async () => {
    try {
      // First try the health endpoint
      const response = await fetch(`${API_URL}/health`);
      if (!response.ok) {
        // Fall back to the root API endpoint if health endpoint fails
        const rootResponse = await fetch(`${API_URL}`);
        if (!rootResponse.ok) {
          throw new Error('API health check failed');
        }
      }
      await fetchProducts();
      setLoading(false);
    } catch (error) {
      console.error('API health check error:', error);
      setError('Server is starting up, please wait...');
      // Retry after a delay
      setTimeout(checkAPI, 5000);
    }
  };

  useEffect(() => {
    checkAPI();
  }, [fetchProducts]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        <p>Loading products...</p>
        <p className="note">This may take up to 60 seconds on the first load.</p>
      </div>
    );
  }

  if (error) {
    return <div className="error">{error}</div>;
  }

  return (
    <div className="app">
      <Navigation />
      <main className="main-content">
        <Routes>
          <Route 
            path="/" 
            element={<ProductListing products={products} onProductsChange={fetchProducts} />} 
          />
          <Route 
            path="/product/:productId" 
            element={<ProductPage products={products} onProductsChange={fetchProducts} />} 
          />
          <Route 
            path="/admin"
            element={<AdminLogin />} 
          />
          <Route 
            path="/admin/dashboard"
            element={
              <ProtectedRoute>
                <AdminDashboard onProductsChange={fetchProducts} />
              </ProtectedRoute>
            } 
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
  );
};

const App: React.FC = () => {
  return (
    <AdminProvider>
      <CartProvider>
        <Router>
          <AppContent />
        </Router>
      </CartProvider>
    </AdminProvider>
  );
};

export default App;
