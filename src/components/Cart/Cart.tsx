import React, { useState, useContext, FormEvent, useEffect } from 'react';
import { CartContext, CartItem } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
import CityAutocomplete from './CityAutocomplete';
import { City } from '../../types/settings';
import styles from './Cart.module.scss';

// Shipping options with pricing
const SHIPPING_OPTIONS = [
  { id: 'standard', name: 'Standard Shipping', price: 5.99, days: '3-5' },
  { id: 'express', name: 'Express Shipping', price: 9.99, days: '1-2' },
  { id: 'pickup', name: 'Local Pickup', price: 0, days: '1' }
];

// Payment methods
const PAYMENT_METHODS = [
  { id: 'card', name: 'Credit/Debit Card' },
  { id: 'paypal', name: 'PayPal' },
  { id: 'cash', name: 'Cash on Delivery' }
];

export const Cart: React.FC = () => {
  const { cartItems, addToCart, removeFromCart, clearCart } = useContext(CartContext);
  const { settings, calculateShippingCost } = useSettings();
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [cityData, setCityData] = useState<City | null>(null);
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  
  // Order options
  const [shippingMethod, setShippingMethod] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  
  // UI states
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [orderStep, setOrderStep] = useState<'cart' | 'checkout' | 'confirmation'>('cart');
  const [orderNumber, setOrderNumber] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [outOfDeliveryRange, setOutOfDeliveryRange] = useState(false);

  // Set default shipping and payment methods when settings are loaded
  useEffect(() => {
    if (settings) {
      // Set default shipping method
      const defaultShipping = settings.shipping.options.find(option => option.isDefault);
      if (defaultShipping) setShippingMethod(defaultShipping.id);
      else if (settings.shipping.options.length > 0) setShippingMethod(settings.shipping.options[0].id);
      
      // Set default payment method
      const enabledPaymentMethods = settings.payment.methods.filter(method => method.enabled);
      const defaultPayment = enabledPaymentMethods.find(method => method.isDefault);
      if (defaultPayment) setPaymentMethod(defaultPayment.id);
      else if (enabledPaymentMethods.length > 0) setPaymentMethod(enabledPaymentMethods[0].id);
    }
  }, [settings]);

  // Calculate order totals
  const subtotal = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
  
  // Get selected shipping option
  const selectedShipping = settings.shipping.options.find(option => option.id === shippingMethod) || 
    (settings.shipping.options.length > 0 ? settings.shipping.options[0] : { id: '', name: '', price: 0, days: '' });
  
  // Calculate shipping cost based on distance if applicable
  const isDistanceBased = selectedShipping.isDistanceBased === true;
  const cityDistance = cityData?.distance || 0;
  
  let shippingCost = selectedShipping?.price || 0;
  
  if (isDistanceBased && cityData && shippingMethod) {
    const calculatedCost = calculateShippingCost(shippingMethod, cityDistance);
    
    if (calculatedCost === -1) {
      setOutOfDeliveryRange(true);
    } else {
      setOutOfDeliveryRange(false);
      shippingCost = calculatedCost;
    }
  }
  
  const totalPrice = subtotal + shippingCost;

  // Generate order number
  useEffect(() => {
    if (orderStep === 'confirmation' && !orderNumber) {
      const randomNum = Math.floor(10000 + Math.random() * 90000);
      const date = new Date();
      const orderNum = `TKT-${date.getFullYear()}${(date.getMonth() + 1).toString().padStart(2, '0')}${randomNum}`;
      setOrderNumber(orderNum);
    }
  }, [orderStep, orderNumber]);

  // Handle quantity change for cart items
  const handleQuantityChange = (item: CartItem, newQuantity: number) => {
    // Remove item if quantity is 0
    if (newQuantity <= 0) {
      removeFromCart(item.id);
      return;
    }
    
    // Calculate the difference to add to cart
    const quantityDiff = newQuantity - item.quantity;
    
    // Update the quantity
    addToCart({ ...item }, quantityDiff);
  };
  
  // Handle city selection
  const handleCityChange = (selectedCity: City) => {
    setCity(selectedCity.name);
    setCityData(selectedCity);
    
    // Reset shipping method if it was out of range
    if (outOfDeliveryRange) {
      // Find a non-distance shipping option or the first available
      const regularOption = settings.shipping.options.find(opt => !opt.isDistanceBased);
      if (regularOption) {
        setShippingMethod(regularOption.id);
      }
      setOutOfDeliveryRange(false);
    }
  };

  // Handle shipping method change
  const handleShippingMethodChange = (methodId: string) => {
    const option = settings.shipping.options.find(opt => opt.id === methodId);
    
    // Check if this option is distance-based and we need city data
    if (option?.isDistanceBased && !cityData) {
      setFormErrors(prev => ({
        ...prev,
        city: 'Please select a city for distance-based shipping'
      }));
      return;
    }
    
    // Check if the city is within delivery range
    if (option?.isDistanceBased && cityData) {
      const cost = calculateShippingCost(methodId, cityData.distance);
      if (cost === -1) {
        setFormErrors(prev => ({
          ...prev,
          shippingMethod: `This delivery option is not available for your location (${cityData.distance} km is beyond the ${option.maxDistance} km limit)`
        }));
        setOutOfDeliveryRange(true);
        return;
      }
    }
    
    // Clear any shipping errors
    if (formErrors.shippingMethod) {
      setFormErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors.shippingMethod;
        return newErrors;
      });
    }
    
    setShippingMethod(methodId);
    setOutOfDeliveryRange(false);
  };

  // Validate form fields
  const validateForm = () => {
    const errors: Record<string, string> = {};
    
    if (!name.trim()) errors.name = 'Name is required';
    if (!email.trim()) errors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) errors.email = 'Email is invalid';
    if (!address.trim()) errors.address = 'Address is required';
    if (!city.trim()) errors.city = 'City is required';
    if (!postalCode.trim()) errors.postalCode = 'Postal code is required';
    if (!phone.trim()) errors.phone = 'Phone is required';
    else if (!/^\d{10,}$/.test(phone.replace(/[^0-9]/g, ''))) errors.phone = 'Please enter a valid phone number';
    
    // Check if shipping method is selected
    if (!shippingMethod) errors.shippingMethod = 'Please select a shipping method';
    
    // Check if selected shipping method is out of range
    if (outOfDeliveryRange) {
      const option = settings.shipping.options.find(opt => opt.id === shippingMethod);
      errors.shippingMethod = `This delivery option is not available for your location (${cityData?.distance} km is beyond the ${option?.maxDistance} km limit)`;
    }
    
    // Check if payment method is selected
    if (!paymentMethod) errors.paymentMethod = 'Please select a payment method';
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Handle checkout form submission
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // Find selected payment method
      const selectedPaymentMethod = settings.payment.methods.find(method => method.id === paymentMethod);
      
      // Construct order details
      let orderDetails = `Order Details:%0D%0A%0D%0A`;
      cartItems.forEach((item: CartItem) => {
        orderDetails += `${item.title} - Quantity: ${item.quantity} - Price: €${(item.price * item.quantity).toFixed(2)}%0D%0A`;
      });
      
      orderDetails += `%0D%0ASubtotal: €${subtotal.toFixed(2)}%0D%0A`;
      orderDetails += `Shipping (${selectedShipping.name}): €${shippingCost.toFixed(2)}%0D%0A`;
      orderDetails += `Total: €${totalPrice.toFixed(2)}%0D%0A%0D%0A`;
      
      orderDetails += `Payment Method: ${selectedPaymentMethod?.name || 'Not specified'}%0D%0A%0D%0A`;
      
      orderDetails += `Customer Details:%0D%0A`;
      orderDetails += `Name: ${name}%0D%0A`;
      orderDetails += `Email: ${email}%0D%0A`;
      orderDetails += `Address: ${address}%0D%0A`;
      orderDetails += `City: ${city}${cityData?.distance ? ` (${cityData.distance} km from store)` : ''}%0D%0A`;
      orderDetails += `Postal Code: ${postalCode}%0D%0A`;
      orderDetails += `Phone: ${phone}%0D%0A`;
      orderDetails += `Message: ${message}%0D%0A`;
      
      // In a real app, here you would send the order to your backend
      // For now, we'll simulate a successful order
      
      // Clear cart and move to confirmation step
      clearCart();
      setOrderStep('confirmation');
    } catch (error) {
      console.error('Error submitting order:', error);
      setFormErrors({
        submit: 'There was an error submitting your order. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  // Render the cart items
  const renderCartItems = () => {
    if (cartItems.length === 0) {
      return (
        <div className={styles.emptyCart}>
          <p>Your cart is empty.</p>
          <button onClick={() => window.location.href = '/'}>Continue Shopping</button>
        </div>
      );
    }
    
    return (
      <ul className={styles.cartList}>
        {cartItems.map((item: CartItem) => (
          <li key={item.id} className={styles.cartItem}>
            {item.images && item.images.length > 0 && (
              <img src={item.images[0]} alt={item.title} className={styles.productImage} />
            )}
            
            <div className={styles.productInfo}>
              <div className={styles.productTitle}>{item.title}</div>
              <div className={styles.productPrice}>€{item.price.toFixed(2)}</div>
            </div>
            
            <div className={styles.quantityControls}>
              <button 
                onClick={() => handleQuantityChange(item, item.quantity - 1)}
                disabled={item.quantity <= 1}
              >
                -
              </button>
              <span>{item.quantity}</span>
              <button onClick={() => handleQuantityChange(item, item.quantity + 1)}>
                +
              </button>
            </div>
            
            <div className={styles.itemTotal}>
              €{(item.price * item.quantity).toFixed(2)}
            </div>
            
            <button 
              className={styles.removeButton}
              onClick={() => removeFromCart(item.id)}
              aria-label="Remove item"
            >
              ✕
            </button>
          </li>
        ))}
      </ul>
    );
  };

  // Render the order summary
  const renderOrderSummary = () => (
    <div className={styles.orderSummary}>
      <div className={styles.totalPrice}>
        <span>Subtotal:</span>
        <span>€{subtotal.toFixed(2)}</span>
      </div>
      
      <div className={styles.totalPrice}>
        <span>Shipping:</span>
        <span>
          {outOfDeliveryRange 
            ? 'Not available for your location' 
            : `€${shippingCost.toFixed(2)}`}
        </span>
      </div>
      
      <div className={styles.totalPrice}>
        <span>Total:</span>
        <span>€{totalPrice.toFixed(2)}</span>
      </div>
      {orderStep === 'cart' && (
        <button 
          type="button"
          onClick={() => setOrderStep('checkout')}
          className={styles.proceedButton}
          disabled={cartItems.length === 0}
        >
          Proceed to Checkout
        </button>
      )}
    </div>
  );

  // Render the checkout form
  const renderCheckoutForm = () => (
    <form onSubmit={handleSubmit} className={styles.checkoutForm}>
      <div className={styles.formSection}>
        <h2>Shipping Information</h2>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="name">Full Name</label>
            <input
              type="text"
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className={formErrors.name ? styles.errorInput : ''}
            />
            {formErrors.name && <span className={styles.errorText}>{formErrors.name}</span>}
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={formErrors.email ? styles.errorInput : ''}
            />
            {formErrors.email && <span className={styles.errorText}>{formErrors.email}</span>}
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="address">Street Address</label>
            <input
              type="text"
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className={formErrors.address ? styles.errorInput : ''}
            />
            {formErrors.address && <span className={styles.errorText}>{formErrors.address}</span>}
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="city">City</label>
            <CityAutocomplete
              value={city}
              onChange={handleCityChange}
              className={formErrors.city ? styles.errorInput : ''}
              errorText={formErrors.city}
            />
            
            {cityData && cityData.distance !== undefined && (
              <div className={styles.distanceShippingInfo}>
                Distance from store: <strong>{cityData.distance} km</strong>
              </div>
            )}
          </div>
          
          <div className={styles.formGroup}>
            <label htmlFor="postalCode">Postal Code</label>
            <input
              type="text"
              id="postalCode"
              value={postalCode}
              onChange={(e) => setPostalCode(e.target.value)}
              className={formErrors.postalCode ? styles.errorInput : ''}
            />
            {formErrors.postalCode && <span className={styles.errorText}>{formErrors.postalCode}</span>}
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formGroup}>
            <label htmlFor="phone">Phone Number</label>
            <input
              type="tel"
              id="phone"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className={formErrors.phone ? styles.errorInput : ''}
            />
            {formErrors.phone && <span className={styles.errorText}>{formErrors.phone}</span>}
          </div>
        </div>
      </div>
      
      <div className={styles.formSection}>
        <div className={styles.shippingOptions}>
          <h3>Shipping Method</h3>
          <div className={styles.optionsList}>
            {settings.shipping.options.map(option => {
              // Get the shipping cost for this option
              const optionPrice = option.isDistanceBased && cityData
                ? calculateShippingCost(option.id, cityData.distance)
                : option.price;
                
              // Skip options that are out of range
              if (optionPrice === -1) return null;
              
              return (
                <div 
                  key={option.id}
                  className={`${styles.optionItem} ${shippingMethod === option.id ? styles.selected : ''}`}
                  onClick={() => handleShippingMethodChange(option.id)}
                >
                  <input 
                    type="radio" 
                    id={`shipping-${option.id}`}
                    name="shippingMethod"
                    value={option.id}
                    checked={shippingMethod === option.id}
                    onChange={() => handleShippingMethodChange(option.id)}
                  />
                  <div className={styles.optionDetails}>
                    <div className={styles.optionName}>{option.name}</div>
                    <div className={styles.optionDescription}>
                      Delivery in {option.days} days
                      {option.isDistanceBased && cityData && (
                        <span> • Based on {cityData.distance} km distance</span>
                      )}
                    </div>
                  </div>
                  <div className={styles.optionPrice}>
                    €{optionPrice.toFixed(2)}
                  </div>
                </div>
              );
            })}
          </div>
          {formErrors.shippingMethod && (
            <span className={styles.errorText}>{formErrors.shippingMethod}</span>
          )}
        </div>
        
        <div className={styles.paymentOptions}>
          <h3>Payment Method</h3>
          <div className={styles.optionsList}>
            {settings.payment.methods
              .filter(method => method.enabled)
              .map(method => (
                <div 
                  key={method.id}
                  className={`${styles.optionItem} ${paymentMethod === method.id ? styles.selected : ''}`}
                  onClick={() => setPaymentMethod(method.id)}
                >
                  <input 
                    type="radio" 
                    id={`payment-${method.id}`}
                    name="paymentMethod"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                  />
                  <div className={styles.optionDetails}>
                    <div className={styles.optionName}>{method.name}</div>
                  </div>
                </div>
              ))
            }
          </div>
          {formErrors.paymentMethod && (
            <span className={styles.errorText}>{formErrors.paymentMethod}</span>
          )}
        </div>
      </div>
      
      <div className={styles.formSection}>
        <div className={styles.formGroup}>
          <label htmlFor="message">Order Notes (Optional)</label>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            rows={4}
          />
        </div>
      </div>
      
      {formErrors.submit && (
        <div className={styles.errorMessage}>{formErrors.submit}</div>
      )}
      
      <div className={styles.formActions}>
        <button 
          type="button" 
          onClick={() => setOrderStep('cart')}
          className={styles.cancelButton}
        >
          Back to Cart
        </button>
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isSubmitting || outOfDeliveryRange}
        >
          {isSubmitting ? 'Processing...' : 'Place Order'}
        </button>
      </div>
    </form>
  );

  // Render the order confirmation
  const renderOrderConfirmation = () => (
    <div className={styles.orderSuccess}>
      <h2>Thank you for your order!</h2>
      <p>Your order has been placed successfully. We have sent a confirmation email with all the details.</p>
      <div className={styles.orderNumber}>Order #{orderNumber}</div>
      <p>You will receive updates about your order status via email.</p>
      <button onClick={() => window.location.href = '/'}>
        Continue Shopping
      </button>
    </div>
  );

  return (
    <div className={styles.cartContainer}>
      <h1>{orderStep === 'cart' ? 'Your Cart' : orderStep === 'checkout' ? 'Checkout' : 'Order Confirmation'}</h1>
      
      {orderStep === 'cart' && renderCartItems()}
      {orderStep === 'checkout' && renderCartItems()}
      {orderStep === 'confirmation' && renderOrderConfirmation()}
      
      {orderStep !== 'confirmation' && renderOrderSummary()}
      {orderStep === 'checkout' && renderCheckoutForm()}
    </div>
  );
}; 