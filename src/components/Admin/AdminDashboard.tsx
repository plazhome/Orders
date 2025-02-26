import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import { AddProduct } from '../AddProduct/AddProduct';
import styles from './Admin.module.scss';

interface AdminDashboardProps {
    onProductsChange: () => Promise<void>;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onProductsChange }) => {
    const { logout } = useAdmin();
    const navigate = useNavigate();

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
            <AddProduct onProductAdded={onProductsChange} />
        </div>
    );
}; 