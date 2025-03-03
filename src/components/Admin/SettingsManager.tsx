import React from 'react';
import StoreSettings from './StoreSettings';
import styles from './Admin.module.scss';

export const SettingsManager: React.FC = () => {
    return (
        <div className={styles.settingsContainer}>
            <h2>Store Settings</h2>
            <p className={styles.settingsDescription}>
                Configure your store's shipping options, payment methods, and distance-based shipping calculations.
            </p>
            
            <StoreSettings />
        </div>
    );
}; 