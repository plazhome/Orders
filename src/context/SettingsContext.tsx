import React, { createContext, useState, useContext, useEffect } from 'react';
import { StoreSettings, ShippingOption, PaymentMethod } from '../types/settings';

// Default shipping options
const DEFAULT_SHIPPING_OPTIONS: ShippingOption[] = [
    { id: 'standard', name: 'Standard Shipping', price: 5.99, days: '3-5', isDefault: true },
    { id: 'express', name: 'Express Shipping', price: 9.99, days: '1-2' },
    { id: 'pickup', name: 'Local Pickup', price: 0, days: '1' }
];

// Default payment methods
const DEFAULT_PAYMENT_METHODS: PaymentMethod[] = [
    { id: 'card', name: 'Credit/Debit Card', enabled: true, isDefault: true },
    { id: 'paypal', name: 'PayPal', enabled: true },
    { id: 'cash', name: 'Cash on Delivery', enabled: true }
];

// Default store location (Athens, Greece)
const DEFAULT_STORE_LOCATION = {
    lat: 37.9838,
    lng: 23.7275,
    city: 'Athens',
    address: 'Sample Store Address, 12345'
};

// Default settings
const DEFAULT_SETTINGS: StoreSettings = {
    shipping: {
        options: DEFAULT_SHIPPING_OPTIONS,
        storeLocation: DEFAULT_STORE_LOCATION
    },
    payment: {
        methods: DEFAULT_PAYMENT_METHODS,
    }
};

interface SettingsContextType {
    settings: StoreSettings;
    updateShippingOption: (option: ShippingOption) => void;
    deleteShippingOption: (id: string) => void;
    addShippingOption: (option: ShippingOption) => void;
    updatePaymentMethod: (method: PaymentMethod) => void;
    setDefaultShippingOption: (id: string) => void;
    setDefaultPaymentMethod: (id: string) => void;
    updateStoreLocation: (location: typeof DEFAULT_STORE_LOCATION) => void;
    calculateShippingCost: (optionId: string, distanceKm?: number) => number;
}

const SettingsContext = createContext<SettingsContextType>({
    settings: DEFAULT_SETTINGS,
    updateShippingOption: () => {},
    deleteShippingOption: () => {},
    addShippingOption: () => {},
    updatePaymentMethod: () => {},
    setDefaultShippingOption: () => {},
    setDefaultPaymentMethod: () => {},
    updateStoreLocation: () => {},
    calculateShippingCost: () => 0
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    // Initialize settings from localStorage or defaults
    const [settings, setSettings] = useState<StoreSettings>(() => {
        const savedSettings = localStorage.getItem('storeSettings');
        if (savedSettings) {
            try {
                return JSON.parse(savedSettings);
            } catch (error) {
                console.error('Error parsing saved settings:', error);
            }
        }
        return DEFAULT_SETTINGS;
    });

    // Update shipping option
    const updateShippingOption = (option: ShippingOption) => {
        const updatedOptions = settings.shipping.options.map(opt => 
            opt.id === option.id ? option : opt
        );
        
        const updatedSettings = {
            ...settings,
            shipping: {
                ...settings.shipping,
                options: updatedOptions
            }
        };
        
        setSettings(updatedSettings);
        localStorage.setItem('storeSettings', JSON.stringify(updatedSettings));
    };

    // Delete shipping option
    const deleteShippingOption = (id: string) => {
        // Check if trying to delete the only option or the default option
        if (settings.shipping.options.length <= 1) {
            alert('Cannot delete the only shipping option.');
            return;
        }
        
        const isDefault = settings.shipping.options.find(opt => opt.id === id)?.isDefault;
        const updatedOptions = settings.shipping.options.filter(opt => opt.id !== id);
        
        // If deleting the default, set a new default
        if (isDefault && updatedOptions.length > 0) {
            updatedOptions[0].isDefault = true;
        }
        
        const updatedSettings = {
            ...settings,
            shipping: {
                ...settings.shipping,
                options: updatedOptions
            }
        };
        
        setSettings(updatedSettings);
        localStorage.setItem('storeSettings', JSON.stringify(updatedSettings));
    };

    // Add new shipping option
    const addShippingOption = (option: ShippingOption) => {
        // Check if an option with this ID already exists
        if (settings.shipping.options.some(opt => opt.id === option.id)) {
            alert('A shipping option with this ID already exists.');
            return;
        }
        
        // If this is the first option, make it default
        if (settings.shipping.options.length === 0) {
            option.isDefault = true;
        }
        
        const updatedOptions = [...settings.shipping.options, option];
        
        const updatedSettings = {
            ...settings,
            shipping: {
                ...settings.shipping,
                options: updatedOptions
            }
        };
        
        setSettings(updatedSettings);
        localStorage.setItem('storeSettings', JSON.stringify(updatedSettings));
    };

    // Update payment method
    const updatePaymentMethod = (method: PaymentMethod) => {
        // Ensure we always have at least one enabled payment method
        const willDisable = !method.enabled;
        const enabledCount = settings.payment.methods.filter(m => m.enabled).length;
        
        if (willDisable && enabledCount <= 1) {
            alert('Cannot disable the only enabled payment method.');
            return;
        }
        
        const updatedMethods = settings.payment.methods.map(m => 
            m.id === method.id ? method : m
        );
        
        const updatedSettings = {
            ...settings,
            payment: {
                ...settings.payment,
                methods: updatedMethods
            }
        };
        
        setSettings(updatedSettings);
        localStorage.setItem('storeSettings', JSON.stringify(updatedSettings));
    };

    // Set default shipping option
    const setDefaultShippingOption = (id: string) => {
        const updatedOptions = settings.shipping.options.map(opt => ({
            ...opt,
            isDefault: opt.id === id
        }));
        
        const updatedSettings = {
            ...settings,
            shipping: {
                ...settings.shipping,
                options: updatedOptions
            }
        };
        
        setSettings(updatedSettings);
        localStorage.setItem('storeSettings', JSON.stringify(updatedSettings));
    };

    // Set default payment method
    const setDefaultPaymentMethod = (id: string) => {
        // Only update if the method is enabled
        const method = settings.payment.methods.find(m => m.id === id);
        if (!method?.enabled) {
            alert('Cannot set a disabled payment method as default.');
            return;
        }
        
        const updatedMethods = settings.payment.methods.map(m => ({
            ...m,
            isDefault: m.id === id
        }));
        
        const updatedSettings = {
            ...settings,
            payment: {
                ...settings.payment,
                methods: updatedMethods
            }
        };
        
        setSettings(updatedSettings);
        localStorage.setItem('storeSettings', JSON.stringify(updatedSettings));
    };

    // Update store location
    const updateStoreLocation = (location: typeof DEFAULT_STORE_LOCATION) => {
        const updatedSettings = {
            ...settings,
            shipping: {
                ...settings.shipping,
                storeLocation: location
            }
        };
        
        setSettings(updatedSettings);
        localStorage.setItem('storeSettings', JSON.stringify(updatedSettings));
    };

    // Calculate shipping cost based on distance
    const calculateShippingCost = (optionId: string, distanceKm?: number): number => {
        const option = settings.shipping.options.find(opt => opt.id === optionId);
        
        if (!option) {
            return 0;
        }
        
        // If this is a distance-based option and we have a distance
        if (option.isDistanceBased && distanceKm !== undefined && option.pricePerKm) {
            // Apply distance restrictions if configured
            if (option.maxDistance && distanceKm > option.maxDistance) {
                return -1; // Out of delivery range
            }
            
            // Calculate price based on distance
            const basePrice = option.basePrice || 0;
            const distancePrice = option.pricePerKm * distanceKm;
            
            return Number((basePrice + distancePrice).toFixed(2));
        }
        
        // Otherwise use the standard price
        return option.price;
    };

    return (
        <SettingsContext.Provider value={{
            settings,
            updateShippingOption,
            deleteShippingOption,
            addShippingOption,
            updatePaymentMethod,
            setDefaultShippingOption,
            setDefaultPaymentMethod,
            updateStoreLocation,
            calculateShippingCost
        }}>
            {children}
        </SettingsContext.Provider>
    );
}; 