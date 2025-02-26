import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import styles from './Navigation.module.scss';

export const Navigation: React.FC = () => {
    const location = useLocation();
    const { totalCount } = useContext(CartContext);

    return (
        <nav className={styles.navigation}>
            <div className={styles.logo}>
                <Link to="/">TikTok Shop</Link>
            </div>
            <div className={styles.links}>
                <Link 
                    to="/" 
                    className={location.pathname === '/' ? styles.active : ''}
                >
                    Products
                </Link>
                <Link 
                    to="/add-product"
                    className={location.pathname === '/add-product' ? styles.active : ''}
                >
                    Add Product
                </Link>
                <Link 
                    to="/cart"
                    className={location.pathname === '/cart' ? styles.active : ''}
                >
                    Cart ({totalCount})
                </Link>
            </div>
        </nav>
    );
}; 