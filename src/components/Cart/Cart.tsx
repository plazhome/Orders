import React, { useState, useContext, FormEvent, useEffect } from 'react';
import { CartContext, CartItem } from '../../context/CartContext';
import { useSettings } from '../../context/SettingsContext';
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
  const { settings } = useSettings();
  
  // Form fields
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
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
  
  const shippingCost = selectedShipping?.price || 0;
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
      orderDetails += `City: ${city}%0D%0A`;
      orderDetails += `Postal Code: ${postalCode}%0D%0A`;
      orderDetails += `Phone: ${phone}%0D%0A`;
      orderDetails += `Message: ${message}%0D%0A`;

      // Construct mailto link with specific email address
      const subject = encodeURIComponent(`New Order #${orderNumber}`);
      const body = orderDetails;
      const mailtoLink = `mailto:plazgr@gmail.com?subject=${subject}&body=${body}`;

      // Open default email client
      window.location.href = mailtoLink;
      
      // Move to confirmation step
      setOrderStep('confirmation');
      
      // In a real app, we would make an API call to process the order here
      // For now, we'll simulate a successful order
    } catch (error) {
      console.error('Error processing order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle return to shopping
  const handleReturnToShopping = () => {
    clearCart();
    // Reset form fields
    setName('');
    setEmail('');
    setAddress('');
    setCity('');
    setPostalCode('');
    setPhone('');
    setMessage('');
    setShippingMethod(settings.shipping.options.find(option => option.isDefault)?.id || '');
    setPaymentMethod(settings.payment.methods.find(method => method.isDefault && method.enabled)?.id || '');
    setOrderStep('cart');
    setOrderNumber('');
    window.location.href = '/'; // Navigate to home page
  };

  // Render cart items
  const renderCartItems = () => (
    <ul className={styles.cartList}>
      {cartItems.map(item => (
        <li key={item.id} className={styles.cartItem}>
          <div className={styles.itemImage}>
            <img src={item.images[0]} alt={item.title} />
          </div>
          <div className={styles.itemDetails}>
            <h3>{item.title}</h3>
            <p className={styles.itemPrice}>€{item.price.toFixed(2)}</p>
          </div>
          <div className={styles.itemActions}>
            <div className={styles.quantityControl}>
              <button 
                type="button"
                onClick={() => handleQuantityChange(item, item.quantity - 1)}
                className={styles.quantityButton}
              >
                -
              </button>
              <span className={styles.quantity}>{item.quantity}</span>
              <button 
                type="button"
                onClick={() => handleQuantityChange(item, item.quantity + 1)}
                className={styles.quantityButton}
              >
                +
              </button>
            </div>
            <p className={styles.itemTotal}>
              €{(item.price * item.quantity).toFixed(2)}
            </p>
            <button 
              type="button"
              onClick={() => removeFromCart(item.id)}
              className={styles.removeItem}
            >
              Remove
            </button>
          </div>
        </li>
      ))}
    </ul>
  );

  // Render cart summary
  const renderCartSummary = () => (
    <div className={styles.cartSummary}>
      <h2>Order Summary</h2>
      <div className={styles.summaryRow}>
        <span>Subtotal</span>
        <span>€{subtotal.toFixed(2)}</span>
      </div>
      <div className={styles.summaryRow}>
        <span>Shipping</span>
        <span>€{shippingCost.toFixed(2)}</span>
      </div>
      <div className={`${styles.summaryRow} ${styles.totalRow}`}>
        <span>Total</span>
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
            <input
              type="text"
              id="city"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className={formErrors.city ? styles.errorInput : ''}
            />
            {formErrors.city && <span className={styles.errorText}>{formErrors.city}</span>}
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
        <h2>Shipping Method</h2>
        {formErrors.shippingMethod && (
          <span className={styles.errorText}>{formErrors.shippingMethod}</span>
        )}
        <div className={styles.optionsGroup}>
          {settings.shipping.options.map(option => (
            <div className={styles.optionItem} key={option.id}>
              <input
                type="radio"
                id={`shipping-${option.id}`}
                name="shipping"
                value={option.id}
                checked={shippingMethod === option.id}
                onChange={(e) => setShippingMethod(e.target.value)}
              />
              <label htmlFor={`shipping-${option.id}`}>
                <span className={styles.optionName}>{option.name}</span>
                <span className={styles.optionDetails}>
                  {option.price === 0 ? 'Free' : `€${option.price.toFixed(2)}`} - {option.days} business day{option.days !== '1' ? 's' : ''}
                </span>
              </label>
            </div>
          ))}
        </div>
      </div>
      
      <div className={styles.formSection}>
        <h2>Payment Method</h2>
        {formErrors.paymentMethod && (
          <span className={styles.errorText}>{formErrors.paymentMethod}</span>
        )}
        <div className={styles.optionsGroup}>
          {settings.payment.methods
            .filter(method => method.enabled)
            .map(method => (
              <div className={styles.optionItem} key={method.id}>
                <input
                  type="radio"
                  id={`payment-${method.id}`}
                  name="payment"
                  value={method.id}
                  checked={paymentMethod === method.id}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <label htmlFor={`payment-${method.id}`}>
                  <span className={styles.optionName}>{method.name}</span>
                </label>
              </div>
            ))}
        </div>
      </div>
      
      <div className={styles.formSection}>
        <h2>Additional Notes</h2>
        <div className={styles.formGroup}>
          <textarea
            id="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Special instructions for delivery, gift messages, etc."
          />
        </div>
      </div>
      
      <div className={styles.formActions}>
        <button 
          type="button" 
          onClick={() => setOrderStep('cart')}
          className={styles.backButton}
        >
          Back to Cart
        </button>
        <button 
          type="submit" 
          className={styles.submitButton}
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Processing...' : 'Complete Order'}
        </button>
      </div>
    </form>
  );

  // Render order confirmation
  const renderOrderConfirmation = () => (
    <div className={styles.orderConfirmation}>
      <div className={styles.confirmationIcon}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="2" />
          <path d="M6 12L10 16L18 8" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
      <h2>Order Confirmed!</h2>
      <p className={styles.orderNumber}>Order #{orderNumber}</p>
      <p className={styles.confirmationMessage}>
        Thank you for your purchase! Your email client has been opened to finalize your order.
      </p>
      <p>
        You'll receive a confirmation email with your order details shortly.
      </p>
      <button 
        type="button"
        onClick={handleReturnToShopping}
        className={styles.continueButton}
      >
        Continue Shopping
      </button>
    </div>
  );

  // Render empty cart
  const renderEmptyCart = () => (
    <div className={styles.emptyCart}>
      <div className={styles.emptyCartIcon}>
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none">
          <path d="M3 6H5H21" stroke="currentColor" strokeWidth="2" />
          <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="currentColor" strokeWidth="2" />
        </svg>
      </div>
      <h2>Your cart is empty</h2>
      <p>Looks like you haven't added any products to your cart yet.</p>
      <button 
        type="button"
        onClick={() => window.location.href = '/'}
        className={styles.shopButton}
      >
        Start Shopping
      </button>
    </div>
  );

  return (
    <div className={styles.cartContainer}>
      <h1 className={styles.pageTitle}>
        {orderStep === 'cart' ? 'Shopping Cart' : 
         orderStep === 'checkout' ? 'Checkout' : 
         'Order Complete'}
      </h1>
      
      <div className={styles.cartContent}>
        {orderStep === 'cart' && (
          <>
            {cartItems.length === 0 ? (
              renderEmptyCart()
            ) : (
              <>
                <div className={styles.cartItems}>
                  {renderCartItems()}
                  <div className={styles.cartActions}>
                    <button 
                      type="button"
                      onClick={() => window.location.href = '/'}
                      className={styles.continueShoppingButton}
                    >
                      Continue Shopping
                    </button>
                    <button 
                      type="button"
                      onClick={clearCart}
                      className={styles.clearCartButton}
                    >
                      Clear Cart
                    </button>
                  </div>
                </div>
                <div className={styles.cartSummaryContainer}>
                  {renderCartSummary()}
                </div>
              </>
            )}
          </>
        )}
        
        {orderStep === 'checkout' && (
          <div className={styles.checkoutContainer}>
            <div className={styles.checkoutMain}>
              {renderCheckoutForm()}
            </div>
            <div className={styles.checkoutSummary}>
              {renderCartSummary()}
            </div>
          </div>
        )}
        
        {orderStep === 'confirmation' && renderOrderConfirmation()}
      </div>
    </div>
  );
}; 