import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { ProductListing } from './components/ProductListing/ProductListing';
import { ProductPage } from './components/ProductPage/ProductPage';
import { Navigation } from './components/Navigation/Navigation';
import { Product } from './types/product';
import { CartProvider } from './context/CartContext';
import { AdminProvider, useAdmin } from './context/AdminContext';
import { SettingsProvider } from './context/SettingsContext';
import { AdminLogin } from './components/Admin/AdminLogin';
import { AdminDashboard } from './components/Admin/AdminDashboard';
import { Cart } from './components/Cart/Cart';
import './App.scss';

// API URL based on environment
const API_URL = import.meta.env.PROD 
  ? 'https://tiktok-shop-backend-g9c7.onrender.com/api'
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
    setLoading(true);
    try {
      console.log('Fetching products from:', `${API_URL}/products`);
      const response = await fetch(`${API_URL}/products`);
      
      // Log the raw response
      const rawResponse = await response.text();
      console.log('Raw products response:', rawResponse);
      
      // Try to parse the response as JSON
      let products;
      try {
        products = JSON.parse(rawResponse);
      } catch (parseError) {
        console.error('Error parsing products response:', parseError);
        throw new Error('Invalid JSON response from API');
      }
      
      setProducts(products);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching products:', error);
      setLoading(false);
      setError('Failed to fetch products. Please try again later.');
    }
  }, []);

  // Check API health and fetch products
  const checkAPI = async () => {
    try {
      console.log('Checking API at:', `${API_URL}/debug`);
      // First try the debug endpoint
      const debugResponse = await fetch(`${API_URL}/debug`);
      const debugData = await debugResponse.text(); // Use text() instead of json() to see the raw response
      console.log('Debug endpoint response:', debugData);
      
      if (!debugResponse.ok) {
        // Fall back to the health endpoint if debug endpoint fails
        console.log('Checking health endpoint at:', `${API_URL}/health`);
        const response = await fetch(`${API_URL}/health`);
        const healthData = await response.text(); // Use text() instead of json() to see the raw response
        console.log('Health endpoint response:', healthData);
        
        if (!response.ok) {
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
    <Router>
      <AdminProvider>
        <CartProvider>
          <SettingsProvider>
            <AppContent />
          </SettingsProvider>
        </CartProvider>
      </AdminProvider>
    </Router>
  );
};

export { API_URL };
export default App;
