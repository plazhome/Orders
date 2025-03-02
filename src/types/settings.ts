export interface ShippingOption {
    id: string;
    name: string;
    price: number;
    days: string;
    isDefault?: boolean;
}

export interface PaymentMethod {
    id: string;
    name: string;
    enabled: boolean;
    isDefault?: boolean;
}

export interface StoreSettings {
    shipping: {
        options: ShippingOption[];
    };
    payment: {
        methods: PaymentMethod[];
    };
} 