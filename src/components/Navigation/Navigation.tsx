import React, { useContext } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { CartContext } from '../../context/CartContext';
import { useAdmin } from '../../context/AdminContext';
import styles from './Navigation.module.scss';

export const Navigation: React.FC = () => {
    const location = useLocation();
    const { totalCount } = useContext(CartContext);
    const { isAdmin } = useAdmin();
    
    const isActiveRoute = (path: string) => {
        return location.pathname === path ? styles.active : '';
    };

    return (
        <nav className={styles.navigation}>
            <div className={styles.logo}>
                <Link to="/">TikTok Shop</Link>
            </div>
            <div className={styles.links}>
                <Link to="/" className={isActiveRoute('/')}>
                    Products
                </Link>
                
                {isAdmin && (
                    <>
                        <Link to="/admin/dashboard" className={isActiveRoute('/admin/dashboard')}>
                            Dashboard
                        </Link>
                        <Link 
                            to="/admin/dashboard" 
                            className={`${styles.settingsLink} ${location.pathname === '/admin/dashboard' && styles.active}`}
                            onClick={(e) => {
                                // This will help indicate to the user that clicking this link will 
                                // navigate to the dashboard with the settings tab active
                                if (location.pathname === '/admin/dashboard') {
                                    e.preventDefault();
                                    // Find the settings tab and click it if already on dashboard
                                    const settingsTab = document.querySelector('[data-tab="settings"]');
                                    if (settingsTab) {
                                        (settingsTab as HTMLElement).click();
                                    }
                                } else {
                                    // Add a URL parameter to indicate we want the settings tab
                                    e.currentTarget.href = '/admin/dashboard?tab=settings';
                                }
                            }}
                        >
                            Store Settings
                        </Link>
                    </>
                )}
                
                <Link to="/cart" className={isActiveRoute('/cart')}>
                    <span className={styles.cartIcon}>
                        Cart
                        <span className={styles.cartCount}>{totalCount}</span>
                    </span>
                </Link>
            </div>
        </nav>
    );
}; 