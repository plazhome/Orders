import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { AddProduct } from '../AddProduct/AddProduct';
import { ProductDashboard } from './ProductDashboard';
import { SettingsManager } from './SettingsManager';
import styles from './Admin.module.scss';

interface AdminDashboardProps {
    onProductsChange: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onProductsChange }) => {
    const { logout } = useAdmin();
    const navigate = useNavigate();
    const location = useLocation();
    const [activeTab, setActiveTab] = useState<'manage' | 'add' | 'settings'>('manage');

    // Check for tab parameter in URL
    useEffect(() => {
        const params = new URLSearchParams(location.search);
        const tabParam = params.get('tab');
        
        if (tabParam === 'settings') {
            setActiveTab('settings');
        } else if (tabParam === 'add') {
            setActiveTab('add');
        } else if (tabParam === 'manage') {
            setActiveTab('manage');
        }
    }, [location.search]);

    const handleLogout = () => {
        logout();
        navigate('/');
    };

    return (
        <div className={styles.adminDashboard}>
            <div className={styles.header}>
                <h1>Admin Dashboard</h1>
                <button onClick={handleLogout} className={styles.logoutButton}>
                    Logout
                </button>
            </div>
            
            <div className={styles.tabContainer}>
                <div className={styles.tabs}>
                    <button 
                        data-tab="manage"
                        className={`${styles.tabButton} ${activeTab === 'manage' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('manage')}
                    >
                        Manage Products
                    </button>
                    <button 
                        data-tab="add"
                        className={`${styles.tabButton} ${activeTab === 'add' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('add')}
                    >
                        Add New Product
                    </button>
                    <button 
                        data-tab="settings"
                        className={`${styles.tabButton} ${activeTab === 'settings' ? styles.activeTab : ''}`}
                        onClick={() => setActiveTab('settings')}
                    >
                        Store Settings
                    </button>
                </div>
            </div>
            
            <div className={styles.tabContent}>
                {activeTab === 'add' && (
                    <AddProduct onProductAdded={onProductsChange} />
                )}
                {activeTab === 'manage' && (
                    <ProductDashboard onProductsChange={onProductsChange} />
                )}
                {activeTab === 'settings' && (
                    <SettingsManager />
                )}
            </div>
        </div>
    );
}; 