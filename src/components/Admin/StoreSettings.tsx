import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import DistanceShippingSettings from './DistanceShippingSettings';
import { ShippingOption, PaymentMethod } from '../../types/settings';
import styles from './Admin.module.scss';

export const StoreSettings: React.FC = () => {
  const { 
    settings, 
    addShippingOption, 
    updateShippingOption, 
    deleteShippingOption,
    updatePaymentMethod,
    setDefaultShippingOption,
    setDefaultPaymentMethod
  } = useSettings();
  
  const [newShippingOption, setNewShippingOption] = useState<ShippingOption>({
    id: '',
    name: '',
    price: 0,
    days: '',
  });
  
  const [editingShipping, setEditingShipping] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'shipping' | 'payment' | 'distance-shipping'>('shipping');
  
  // Handle adding a new shipping option
  const handleAddShipping = () => {
    if (!newShippingOption.name || !newShippingOption.days) {
      alert('Please fill out all required fields');
      return;
    }
    
    addShippingOption({
      ...newShippingOption,
      id: `shipping-${Date.now()}`
    });
    
    // Reset form
    setNewShippingOption({
      id: '',
      name: '',
      price: 0,
      days: '',
    });
  };
  
  // Handle updating a shipping option
  const handleUpdateShipping = (id: string, updatedOption: Partial<ShippingOption>) => {
    const option = settings.shipping.options.find(opt => opt.id === id);
    if (!option) return;
    
    updateShippingOption({
      ...option,
      ...updatedOption
    });
    
    setEditingShipping(null);
  };
  
  // Handle payment method toggle
  const handlePaymentToggle = (id: string, enabled: boolean) => {
    const method = settings.payment.methods.find(m => m.id === id);
    if (!method) return;
    
    updatePaymentMethod({
      ...method,
      enabled
    });
  };
  
  return (
    <div className={styles.settingsContainer}>
      <div className={styles.settingsTabs}>
        <button 
          className={`${styles.tabButton} ${activeTab === 'shipping' ? styles.activeTab : ''}`} 
          onClick={() => setActiveTab('shipping')}
        >
          Regular Shipping
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'distance-shipping' ? styles.activeTab : ''}`} 
          onClick={() => setActiveTab('distance-shipping')}
        >
          Distance-Based Shipping
        </button>
        <button 
          className={`${styles.tabButton} ${activeTab === 'payment' ? styles.activeTab : ''}`} 
          onClick={() => setActiveTab('payment')}
        >
          Payment Methods
        </button>
      </div>
      
      <div className={styles.settingsContent}>
        {activeTab === 'shipping' && (
          <div className={styles.settingsSection}>
            <h3>Shipping Options</h3>
            <p className={styles.settingsDescription}>
              Set up the shipping options available to your customers.
            </p>
            
            <ul className={styles.optionsList}>
              {settings.shipping.options
                .filter(option => !option.isDistanceBased)
                .map(option => (
                <li key={option.id} className={styles.optionItem}>
                  {editingShipping === option.id ? (
                    <div className={styles.editForm}>
                      <div className={styles.formRow}>
                        <div className={styles.formControl}>
                          <label>Name</label>
                          <input 
                            type="text" 
                            value={option.name} 
                            onChange={(e) => updateShippingOption({...option, name: e.target.value})}
                            className={styles.input}
                          />
                        </div>
                      </div>
                      
                      <div className={styles.formRow}>
                        <div className={styles.formControl}>
                          <label>Price (€)</label>
                          <input 
                            type="number" 
                            value={option.price} 
                            onChange={(e) => updateShippingOption({...option, price: parseFloat(e.target.value)})}
                            step="0.01"
                            className={styles.input}
                          />
                        </div>
                        
                        <div className={styles.formControl}>
                          <label>Delivery Days</label>
                          <input 
                            type="text" 
                            value={option.days} 
                            onChange={(e) => updateShippingOption({...option, days: e.target.value})}
                            className={styles.input}
                          />
                        </div>
                      </div>
                      
                      <div className={styles.buttonGroup}>
                        <button 
                          type="button" 
                          onClick={() => setEditingShipping(null)}
                          className={styles.secondaryButton}
                        >
                          Cancel
                        </button>
                        <button 
                          type="button" 
                          onClick={() => setEditingShipping(null)}
                          className={styles.primaryButton}
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className={styles.optionContent}>
                      <div className={styles.optionDetails}>
                        <h4>{option.name}</h4>
                        <p>€{option.price.toFixed(2)} • {option.days} days</p>
                      </div>
                      
                      <div className={styles.optionActions}>
                        {option.isDefault ? (
                          <span className={styles.defaultBadge}>Default</span>
                        ) : (
                          <button 
                            type="button" 
                            onClick={() => setDefaultShippingOption(option.id)}
                            className={styles.defaultButton}
                          >
                            Set as Default
                          </button>
                        )}
                        
                        <button 
                          type="button" 
                          onClick={() => setEditingShipping(option.id)}
                          className={styles.editButton}
                        >
                          Edit
                        </button>
                        
                        {!option.isDefault && (
                          <button 
                            type="button" 
                            onClick={() => deleteShippingOption(option.id)}
                            className={styles.deleteButton}
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </li>
              ))}
            </ul>
            
            <div className={styles.addNewForm}>
              <h4>Add New Shipping Option</h4>
              
              <div className={styles.formRow}>
                <div className={styles.formControl}>
                  <label>Name</label>
                  <input 
                    type="text" 
                    value={newShippingOption.name} 
                    onChange={(e) => setNewShippingOption({...newShippingOption, name: e.target.value})} 
                    className={styles.input}
                    placeholder="e.g. Standard Shipping"
                  />
                </div>
              </div>
              
              <div className={styles.formRow}>
                <div className={styles.formControl}>
                  <label>Price (€)</label>
                  <input 
                    type="number" 
                    value={newShippingOption.price} 
                    onChange={(e) => setNewShippingOption({...newShippingOption, price: parseFloat(e.target.value)})} 
                    step="0.01"
                    className={styles.input}
                    placeholder="5.99"
                  />
                </div>
                
                <div className={styles.formControl}>
                  <label>Delivery Days</label>
                  <input 
                    type="text" 
                    value={newShippingOption.days} 
                    onChange={(e) => setNewShippingOption({...newShippingOption, days: e.target.value})} 
                    className={styles.input}
                    placeholder="3-5"
                  />
                </div>
              </div>
              
              <button 
                type="button" 
                onClick={handleAddShipping}
                className={styles.primaryButton}
                disabled={!newShippingOption.name || !newShippingOption.days}
              >
                Add Shipping Option
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'distance-shipping' && (
          <DistanceShippingSettings />
        )}
        
        {activeTab === 'payment' && (
          <div className={styles.settingsSection}>
            <h3>Payment Methods</h3>
            <p className={styles.settingsDescription}>
              Configure the payment methods you accept in your store.
            </p>
            
            <ul className={styles.optionsList}>
              {settings.payment.methods.map(method => (
                <li key={method.id} className={styles.optionItem}>
                  <div className={styles.optionContent}>
                    <div className={styles.optionDetails}>
                      <h4>{method.name}</h4>
                      <p>{method.enabled ? 'Enabled' : 'Disabled'}</p>
                    </div>
                    
                    <div className={styles.optionActions}>
                      <div className={styles.toggleSwitch}>
                        <input 
                          type="checkbox" 
                          id={`toggle-${method.id}`} 
                          checked={method.enabled}
                          onChange={(e) => handlePaymentToggle(method.id, e.target.checked)}
                        />
                        <label htmlFor={`toggle-${method.id}`}>
                          {method.enabled ? 'Enabled' : 'Disabled'}
                        </label>
                      </div>
                      
                      {method.isDefault ? (
                        <span className={styles.defaultBadge}>Default</span>
                      ) : (
                        method.enabled && (
                          <button 
                            type="button" 
                            onClick={() => setDefaultPaymentMethod(method.id)}
                            className={styles.defaultButton}
                          >
                            Set as Default
                          </button>
                        )
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default StoreSettings; 