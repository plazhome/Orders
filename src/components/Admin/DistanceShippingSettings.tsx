import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { ShippingOption } from '../../types/settings';
import CityAutocomplete from '../Cart/CityAutocomplete';
import styles from './Admin.module.scss';

const DistanceShippingSettings: React.FC = () => {
  const { settings, updateShippingOption, addShippingOption } = useSettings();
  
  const [editingOption, setEditingOption] = useState<ShippingOption | null>(null);
  const [newOption, setNewOption] = useState<ShippingOption>({
    id: '',
    name: '',
    price: 0,
    days: '',
    isDistanceBased: true,
    basePrice: 0,
    pricePerKm: 0.1,
    maxDistance: 500
  });
  
  const [storeCity, setStoreCity] = useState(settings.shipping.storeLocation?.city || '');
  const [storeLat, setStoreLat] = useState(settings.shipping.storeLocation?.lat || 0);
  const [storeLng, setStoreLng] = useState(settings.shipping.storeLocation?.lng || 0);
  const [storeAddress, setStoreAddress] = useState(settings.shipping.storeLocation?.address || '');

  // Handle updating the store location
  const handleStoreLocationUpdate = () => {
    const updatedSettings = {
      ...settings,
      shipping: {
        ...settings.shipping,
        storeLocation: {
          lat: storeLat,
          lng: storeLng,
          city: storeCity,
          address: storeAddress
        }
      }
    };
    
    // Save to localStorage
    localStorage.setItem('storeSettings', JSON.stringify(updatedSettings));
    window.location.reload(); // Reload to apply changes
  };

  // Handle selecting a city for the store
  const handleSelectStoreCity = (city: any) => {
    setStoreCity(city.name);
    setStoreLat(parseFloat(city.lat));
    setStoreLng(parseFloat(city.lng));
  };

  // Check if an option is distance-based
  const isDistanceBased = (option: ShippingOption) => {
    return option.isDistanceBased === true;
  };

  // Handle saving an edited option
  const handleSaveOption = () => {
    if (editingOption) {
      updateShippingOption(editingOption);
      setEditingOption(null);
    }
  };

  // Handle adding a new option
  const handleAddOption = () => {
    if (newOption.id && newOption.name) {
      addShippingOption({
        ...newOption,
        id: `distance-${Date.now()}` // Ensure unique ID
      });
      
      // Reset the form
      setNewOption({
        id: '',
        name: '',
        price: 0,
        days: '',
        isDistanceBased: true,
        basePrice: 0,
        pricePerKm: 0.1,
        maxDistance: 500
      });
    }
  };

  // Get distance-based shipping options
  const distanceOptions = settings.shipping.options.filter(isDistanceBased);
  
  return (
    <div className={styles.settingsSection}>
      <h3>Distance-Based Shipping</h3>
      
      <div className={styles.formGroup}>
        <h4>Store Location</h4>
        <p className={styles.settingsDescription}>
          Set your store location to calculate shipping costs based on distance
        </p>
        
        <div className={styles.formRow}>
          <div className={styles.formControl}>
            <label>City</label>
            <CityAutocomplete 
              value={storeCity} 
              onChange={handleSelectStoreCity} 
              className={styles.input}
            />
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formControl}>
            <label>Address</label>
            <input 
              type="text" 
              value={storeAddress} 
              onChange={(e) => setStoreAddress(e.target.value)} 
              className={styles.input}
            />
          </div>
        </div>
        
        <div className={styles.formRow}>
          <div className={styles.formControl}>
            <label>Latitude</label>
            <input 
              type="number" 
              value={storeLat} 
              onChange={(e) => setStoreLat(parseFloat(e.target.value))} 
              className={styles.input}
              step="0.000001"
            />
          </div>
          
          <div className={styles.formControl}>
            <label>Longitude</label>
            <input 
              type="number" 
              value={storeLng} 
              onChange={(e) => setStoreLng(parseFloat(e.target.value))} 
              className={styles.input}
              step="0.000001"
            />
          </div>
        </div>
        
        <button 
          type="button" 
          onClick={handleStoreLocationUpdate}
          className={styles.primaryButton}
        >
          Update Store Location
        </button>
      </div>
      
      <div className={styles.formGroup}>
        <h4>Distance-based Shipping Options</h4>
        
        {distanceOptions.length > 0 ? (
          <ul className={styles.optionsList}>
            {distanceOptions.map(option => (
              <li key={option.id} className={styles.optionItem}>
                {editingOption && editingOption.id === option.id ? (
                  <div className={styles.editForm}>
                    <div className={styles.formRow}>
                      <div className={styles.formControl}>
                        <label>Name</label>
                        <input 
                          type="text" 
                          value={editingOption.name} 
                          onChange={(e) => setEditingOption({...editingOption, name: e.target.value})} 
                          className={styles.input}
                        />
                      </div>
                    </div>
                    
                    <div className={styles.formRow}>
                      <div className={styles.formControl}>
                        <label>Base Price (€)</label>
                        <input 
                          type="number" 
                          value={editingOption.basePrice || 0} 
                          onChange={(e) => setEditingOption({
                            ...editingOption, 
                            basePrice: parseFloat(e.target.value)
                          })} 
                          step="0.01"
                          className={styles.input}
                        />
                      </div>
                      
                      <div className={styles.formControl}>
                        <label>Price per km (€)</label>
                        <input 
                          type="number" 
                          value={editingOption.pricePerKm || 0} 
                          onChange={(e) => setEditingOption({
                            ...editingOption, 
                            pricePerKm: parseFloat(e.target.value)
                          })} 
                          step="0.01"
                          className={styles.input}
                        />
                      </div>
                    </div>
                    
                    <div className={styles.formRow}>
                      <div className={styles.formControl}>
                        <label>Delivery Days</label>
                        <input 
                          type="text" 
                          value={editingOption.days} 
                          onChange={(e) => setEditingOption({...editingOption, days: e.target.value})} 
                          className={styles.input}
                        />
                      </div>
                      
                      <div className={styles.formControl}>
                        <label>Max Distance (km)</label>
                        <input 
                          type="number" 
                          value={editingOption.maxDistance || 0} 
                          onChange={(e) => setEditingOption({
                            ...editingOption, 
                            maxDistance: parseFloat(e.target.value)
                          })} 
                          className={styles.input}
                        />
                      </div>
                    </div>
                    
                    <div className={styles.buttonGroup}>
                      <button 
                        type="button" 
                        onClick={handleSaveOption}
                        className={styles.primaryButton}
                      >
                        Save
                      </button>
                      <button 
                        type="button" 
                        onClick={() => setEditingOption(null)}
                        className={styles.secondaryButton}
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className={styles.optionContent}>
                    <div className={styles.optionDetails}>
                      <h5>{option.name}</h5>
                      <p>Base price: €{option.basePrice?.toFixed(2)}</p>
                      <p>Price per km: €{option.pricePerKm?.toFixed(2)}</p>
                      <p>Delivery: {option.days} days</p>
                      <p>Maximum distance: {option.maxDistance} km</p>
                    </div>
                    
                    <div className={styles.optionActions}>
                      <button 
                        type="button" 
                        onClick={() => setEditingOption(option)}
                        className={styles.editButton}
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className={styles.emptyMessage}>No distance-based shipping options yet.</p>
        )}
        
        <div className={styles.addNewForm}>
          <h5>Add New Distance-based Shipping Option</h5>
          
          <div className={styles.formRow}>
            <div className={styles.formControl}>
              <label>Name</label>
              <input 
                type="text" 
                value={newOption.name} 
                onChange={(e) => setNewOption({...newOption, name: e.target.value})} 
                className={styles.input}
                placeholder="e.g. Standard Distance Shipping"
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formControl}>
              <label>Base Price (€)</label>
              <input 
                type="number" 
                value={newOption.basePrice || 0} 
                onChange={(e) => setNewOption({...newOption, basePrice: parseFloat(e.target.value)})} 
                step="0.01"
                className={styles.input}
                placeholder="2.99"
              />
            </div>
            
            <div className={styles.formControl}>
              <label>Price per km (€)</label>
              <input 
                type="number" 
                value={newOption.pricePerKm || 0} 
                onChange={(e) => setNewOption({...newOption, pricePerKm: parseFloat(e.target.value)})} 
                step="0.01"
                className={styles.input}
                placeholder="0.10"
              />
            </div>
          </div>
          
          <div className={styles.formRow}>
            <div className={styles.formControl}>
              <label>Delivery Days</label>
              <input 
                type="text" 
                value={newOption.days} 
                onChange={(e) => setNewOption({...newOption, days: e.target.value})} 
                className={styles.input}
                placeholder="1-3"
              />
            </div>
            
            <div className={styles.formControl}>
              <label>Max Distance (km)</label>
              <input 
                type="number" 
                value={newOption.maxDistance || 0} 
                onChange={(e) => setNewOption({...newOption, maxDistance: parseFloat(e.target.value)})} 
                className={styles.input}
                placeholder="500"
              />
            </div>
          </div>
          
          <button 
            type="button" 
            onClick={handleAddOption}
            className={styles.primaryButton}
            disabled={!newOption.name || !newOption.days}
          >
            Add Shipping Option
          </button>
        </div>
      </div>
    </div>
  );
};

export default DistanceShippingSettings; 