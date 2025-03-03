export interface ShippingOption {
    id: string;
    name: string;
    price: number;
    days: string;
    isDefault?: boolean;
    isDistanceBased?: boolean;
    pricePerKm?: number;
    basePrice?: number;
    maxDistance?: number;
}

export interface City {
    name: string;
    lat: string;
    lng: string;
    distance?: number;
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
        storeLocation?: {
            lat: number;
            lng: number;
            address: string;
            city: string;
        };
    };
    payment: {
        methods: PaymentMethod[];
    };
} 