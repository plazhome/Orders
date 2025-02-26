import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { useAdmin } from '../../context/AdminContext';
import styles from './Navigation.module.scss';

export const Navigation: React.FC = () => {
    const location = useLocation();
    const { totalCount } = useContext(CartContext);
    const { isAdmin } = useAdmin();

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
                {isAdmin && (
                    <Link 
                        to="/admin/dashboard"
                        className={location.pathname === '/admin/dashboard' ? styles.active : ''}
                    >
                        Dashboard
                    </Link>
                )}
                {!isAdmin && (
                    <Link 
                        to="/admin"
                        className={location.pathname === '/admin' ? styles.active : ''}
                    >
                        Admin
                    </Link>
                )}
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