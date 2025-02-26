import React, { useState, useContext, FormEvent } from 'react';
import { CartContext, CartItem } from '../../context/CartContext';
import styles from './Cart.module.scss';

export const Cart: React.FC = () => {
  const { cartItems, clearCart } = useContext(CartContext);
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [emailSent, setEmailSent] = useState(false);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    
    // Calculate total price
    const totalPrice = cartItems.reduce((total, item) => total + (item.price * item.quantity), 0);
    
    // Construct order details
    let orderDetails = 'Order Details:%0D%0A%0D%0A';
    cartItems.forEach((item: CartItem) => {
      orderDetails += `${item.title} - Quantity: ${item.quantity} - Price: €${item.price * item.quantity}%0D%0A`;
    });
    orderDetails += '%0D%0ATotal Price: €${totalPrice}%0D%0A%0D%0A';
    orderDetails += 'Customer Details:%0D%0A';
    orderDetails += `Name: ${name}%0D%0A`;
    orderDetails += `Address: ${address}%0D%0A`;
    orderDetails += `Phone: ${phone}%0D%0A`;
    orderDetails += `Message: ${message}%0D%0A`;

    // Construct mailto link with specific email address
    const subject = encodeURIComponent('New Order from TikTok Shop');
    const body = orderDetails;
    const mailtoLink = `mailto:plazgr@gmail.com?subject=${subject}&body=${body}`;

    // Open default email client
    window.location.href = mailtoLink;
    
    // Set email sent flag
    setEmailSent(true);
    
    // Clear the cart only after email is sent
    if (emailSent) {
      clearCart();
      // Reset form
      setName('');
      setAddress('');
      setPhone('');
      setMessage('');
      setEmailSent(false);
    }
  };

  return (
    <div className={styles.cartContainer}>
      <h1>Cart</h1>
      {cartItems.length === 0 ? (
        <p>Your cart is empty.</p>
      ) : (
        <div>
          <ul className={styles.cartList}>
            {cartItems.map(item => (
              <li key={item.id} className={styles.cartItem}>
                <span>{item.title}</span>
                <span>Quantity: {item.quantity}</span>
                <span>Price: €{item.price * item.quantity}</span>
              </li>
            ))}
          </ul>
          <div className={styles.totalPrice}>
            Total: €{cartItems.reduce((total, item) => total + (item.price * item.quantity), 0)}
          </div>
          <form onSubmit={handleSubmit} className={styles.orderForm}>
            <div>
              <label htmlFor="name">Name:</label>
              <input
                type="text"
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="address">Address:</label>
              <input
                type="text"
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="phone">Phone:</label>
              <input
                type="tel"
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>
            <div>
              <label htmlFor="message">Message:</label>
              <textarea
                id="message"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
              />
            </div>
            <button type="submit">Send Order by Email</button>
          </form>
        </div>
      )}
    </div>
  );
}; 