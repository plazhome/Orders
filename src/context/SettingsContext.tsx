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

// Default settings
const DEFAULT_SETTINGS: StoreSettings = {
    shipping: {
        options: DEFAULT_SHIPPING_OPTIONS,
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
}

const SettingsContext = createContext<SettingsContextType>({
    settings: DEFAULT_SETTINGS,
    updateShippingOption: () => {},
    deleteShippingOption: () => {},
    addShippingOption: () => {},
    updatePaymentMethod: () => {},
    setDefaultShippingOption: () => {},
    setDefaultPaymentMethod: () => {},
});

export const useSettings = () => useContext(SettingsContext);

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [settings, setSettings] = useState<StoreSettings>(() => {
        // Load settings from localStorage if available
        const savedSettings = localStorage.getItem('storeSettings');
        return savedSettings ? JSON.parse(savedSettings) : DEFAULT_SETTINGS;
    });

    // Save settings to localStorage whenever they change
    useEffect(() => {
        localStorage.setItem('storeSettings', JSON.stringify(settings));
    }, [settings]);

    // Update a shipping option
    const updateShippingOption = (option: ShippingOption) => {
        setSettings(prev => ({
            ...prev,
            shipping: {
                ...prev.shipping,
                options: prev.shipping.options.map(opt => 
                    opt.id === option.id ? { ...option, isDefault: opt.isDefault } : opt
                )
            }
        }));
    };

    // Delete a shipping option
    const deleteShippingOption = (id: string) => {
        // Don't allow deletion if it's the only option or if it's the default
        const isDefault = settings.shipping.options.find(opt => opt.id === id)?.isDefault;
        if (settings.shipping.options.length <= 1 || isDefault) return;

        setSettings(prev => ({
            ...prev,
            shipping: {
                ...prev.shipping,
                options: prev.shipping.options.filter(opt => opt.id !== id)
            }
        }));
    };

    // Add a new shipping option
    const addShippingOption = (option: ShippingOption) => {
        // Generate a unique ID if not provided
        const newOption = {
            ...option,
            id: option.id || `shipping-${Date.now()}`,
            isDefault: false
        };

        setSettings(prev => ({
            ...prev,
            shipping: {
                ...prev.shipping,
                options: [...prev.shipping.options, newOption]
            }
        }));
    };

    // Update a payment method
    const updatePaymentMethod = (method: PaymentMethod) => {
        setSettings(prev => ({
            ...prev,
            payment: {
                ...prev.payment,
                methods: prev.payment.methods.map(m => 
                    m.id === method.id ? { ...method, isDefault: m.isDefault } : m
                )
            }
        }));
    };

    // Set default shipping option
    const setDefaultShippingOption = (id: string) => {
        setSettings(prev => ({
            ...prev,
            shipping: {
                ...prev.shipping,
                options: prev.shipping.options.map(opt => ({
                    ...opt,
                    isDefault: opt.id === id
                }))
            }
        }));
    };

    // Set default payment method
    const setDefaultPaymentMethod = (id: string) => {
        setSettings(prev => ({
            ...prev,
            payment: {
                ...prev.payment,
                methods: prev.payment.methods.map(method => ({
                    ...method,
                    isDefault: method.id === id
                }))
            }
        }));
    };

    return (
        <SettingsContext.Provider 
            value={{ 
                settings,
                updateShippingOption,
                deleteShippingOption,
                addShippingOption,
                updatePaymentMethod,
                setDefaultShippingOption,
                setDefaultPaymentMethod
            }}
        >
            {children}
        </SettingsContext.Provider>
    );
}; 