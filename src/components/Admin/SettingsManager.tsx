import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { ShippingOption, PaymentMethod } from '../../types/settings';
import styles from './SettingsManager.module.scss';

export const SettingsManager: React.FC = () => {
    const { 
        settings, 
        updateShippingOption, 
        deleteShippingOption, 
        addShippingOption,
        updatePaymentMethod,
        setDefaultShippingOption,
        setDefaultPaymentMethod
    } = useSettings();
    
    // Local state for form handling
    const [activeTab, setActiveTab] = useState<'shipping' | 'payment'>('shipping');
    const [newShippingOption, setNewShippingOption] = useState<Partial<ShippingOption>>({
        name: '',
        price: 0,
        days: ''
    });
    const [editingId, setEditingId] = useState<string | null>(null);

    // Handle shipping option form submission
    const handleShippingSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!newShippingOption.name || !newShippingOption.days) {
            alert('Please fill out all fields');
            return;
        }
        
        // If editing existing option
        if (editingId) {
            const updatedOption: ShippingOption = {
                id: editingId,
                name: newShippingOption.name!,
                price: newShippingOption.price || 0,
                days: newShippingOption.days!,
                isDefault: false
            };
            updateShippingOption(updatedOption);
            setEditingId(null);
        } 
        // Adding new option
        else if (newShippingOption.name && newShippingOption.days) {
            const newOption: ShippingOption = {
                id: `shipping-${Date.now()}`,
                name: newShippingOption.name,
                price: newShippingOption.price || 0,
                days: newShippingOption.days,
                isDefault: false
            };
            addShippingOption(newOption);
        }
        
        // Reset form
        setNewShippingOption({
            name: '',
            price: 0,
            days: ''
        });
    };

    // Handle edit button click
    const handleEditOption = (option: ShippingOption) => {
        setEditingId(option.id);
        setNewShippingOption({
            name: option.name,
            price: option.price,
            days: option.days
        });
    };

    // Handle cancel edit
    const handleCancelEdit = () => {
        setEditingId(null);
        setNewShippingOption({
            name: '',
            price: 0,
            days: ''
        });
    };

    // Handle payment method toggle
    const handlePaymentToggle = (method: PaymentMethod) => {
        updatePaymentMethod({
            ...method,
            enabled: !method.enabled
        });
    };

    return (
        <div className={styles.settingsDashboard}>
            <div className={styles.dashboardHeader}>
                <h2>Store Settings</h2>
                <div className={styles.actions}>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'shipping' ? styles.active : ''}`}
                        onClick={() => setActiveTab('shipping')}
                    >
                        Shipping Options
                    </button>
                    <button
                        className={`${styles.tabButton} ${activeTab === 'payment' ? styles.active : ''}`}
                        onClick={() => setActiveTab('payment')}
                    >
                        Payment Methods
                    </button>
                </div>
            </div>
            
            <div className={styles.tableContainer}>
                {/* Shipping Options Tab */}
                {activeTab === 'shipping' && (
                    <div className={`${styles.shippingSettings} ${styles.forceVisibility}`}>
                        <div className={styles.optionsList}>
                            {settings.shipping.options.map(option => (
                                <div key={option.id} className={styles.optionItem}>
                                    <div className={styles.optionDetails}>
                                        <h3>{option.name}</h3>
                                        <div className={styles.optionMeta}>
                                            <span className={styles.metaItem}>Price: €{option.price.toFixed(2)}</span>
                                            <span className={styles.metaItem}>Delivery: {option.days} day{option.days !== '1' ? 's' : ''}</span>
                                            {option.isDefault && (
                                                <span className={styles.defaultBadge}>Default</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.optionActions}>
                                        <button 
                                            onClick={() => setDefaultShippingOption(option.id)}
                                            className={styles.setDefaultButton}
                                            disabled={option.isDefault}
                                        >
                                            Set as Default
                                        </button>
                                        <button 
                                            onClick={() => handleEditOption(option)}
                                            className={styles.editButton}
                                        >
                                            Edit
                                        </button>
                                        <button 
                                            onClick={() => deleteShippingOption(option.id)}
                                            className={styles.deleteButton}
                                            disabled={option.isDefault || settings.shipping.options.length <= 1}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className={styles.addOptionForm}>
                            <h3>{editingId ? 'Edit Shipping Option' : 'Add New Shipping Option'}</h3>
                            <form onSubmit={handleShippingSubmit}>
                                <div className={styles.formRow}>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="shippingName">Name</label>
                                        <input 
                                            type="text"
                                            id="shippingName"
                                            value={newShippingOption.name}
                                            onChange={(e) => setNewShippingOption({...newShippingOption, name: e.target.value})}
                                            placeholder="e.g. Express Shipping"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="shippingPrice">Price (€)</label>
                                        <input 
                                            type="number"
                                            id="shippingPrice"
                                            value={newShippingOption.price}
                                            onChange={(e) => setNewShippingOption({...newShippingOption, price: parseFloat(e.target.value)})}
                                            placeholder="0.00"
                                            min="0"
                                            step="0.01"
                                            required
                                        />
                                    </div>
                                    <div className={styles.formGroup}>
                                        <label htmlFor="shippingDays">Delivery Time (days)</label>
                                        <input 
                                            type="text"
                                            id="shippingDays"
                                            value={newShippingOption.days}
                                            onChange={(e) => setNewShippingOption({...newShippingOption, days: e.target.value})}
                                            placeholder="e.g. 1-2 or 3"
                                            required
                                        />
                                    </div>
                                </div>
                                <div className={styles.formActions}>
                                    {editingId && (
                                        <button 
                                            type="button" 
                                            onClick={handleCancelEdit}
                                            className={styles.cancelButton}
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    <button 
                                        type="submit" 
                                        className={styles.submitButton}
                                    >
                                        {editingId ? 'Update' : 'Add'} Shipping Option
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}
                
                {/* Payment Methods Tab */}
                {activeTab === 'payment' && (
                    <div className={styles.paymentSettings}>
                        <div className={styles.optionsList}>
                            {settings.payment.methods.map(method => (
                                <div key={method.id} className={`${styles.optionItem} ${!method.enabled ? styles.disabled : ''}`}>
                                    <div className={styles.optionDetails}>
                                        <h3>{method.name}</h3>
                                        <div className={styles.optionMeta}>
                                            <span className={method.enabled ? styles.enabledStatus : styles.disabledStatus}>
                                                {method.enabled ? 'Enabled' : 'Disabled'}
                                            </span>
                                            {method.isDefault && (
                                                <span className={styles.defaultBadge}>Default</span>
                                            )}
                                        </div>
                                    </div>
                                    <div className={styles.optionActions}>
                                        <button 
                                            onClick={() => setDefaultPaymentMethod(method.id)}
                                            className={styles.setDefaultButton}
                                            disabled={method.isDefault || !method.enabled}
                                        >
                                            Set as Default
                                        </button>
                                        <button 
                                            onClick={() => handlePaymentToggle(method)}
                                            className={method.enabled ? styles.disableButton : styles.enableButton}
                                        >
                                            {method.enabled ? 'Disable' : 'Enable'}
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        <div className={styles.paymentNote}>
                            <p>Payment methods can be enabled or disabled. At least one payment method must be enabled.</p>
                            <p>The default payment method will be pre-selected for customers during checkout.</p>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}; 