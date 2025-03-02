import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAdmin } from '../../context/AdminContext';
import styles from './Admin.module.scss';

const API_URL = import.meta.env.PROD 
  ? 'https://tiktok-shop-backend.onrender.com/api'
  : 'http://localhost:3001/api';

export const AdminLogin: React.FC = () => {
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const { login } = useAdmin();
    const navigate = useNavigate();

    useEffect(() => {
        // Test API connection on component mount
        fetch(API_URL)
            .then(() => setIsLoading(false))
            .catch(() => {
                setError('Server is starting up, please wait...');
                setIsLoading(false);
            });
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        const success = login(password);
        if (success) {
            navigate('/admin/dashboard');
        } else {
            setError('Invalid password');
            setIsLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className={styles.adminLogin}>
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Please wait while the server starts up...</p>
                    <p className={styles.note}>This may take up to 60 seconds on the first load.</p>
                </div>
            </div>
        );
    }

    return (
        <div className={styles.adminLogin}>
            <h1>Admin Login</h1>
            {error && <div className={styles.error}>{error}</div>}
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                    />
                </div>
                <button type="submit" disabled={isLoading}>
                    {isLoading ? 'Loading...' : 'Login'}
                </button>
            </form>
        </div>
    );
}; 