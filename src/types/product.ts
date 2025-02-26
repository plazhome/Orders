export interface Product {
    id: string;
    title: string;
    description: string;
    price: number;
    images: string[];
    videoUrl?: string;
    category: string;
    tags: string[];
    stock: number;
    rating: number;
    reviews: Review[];
    createdAt: string;
    seller: {
        id: string;
        name: string;
        avatar: string;
    };
}

export interface Review {
    id: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string;
    createdAt: string;
    helpful: number;
}

export interface ProductFilters {
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    rating?: number;
    sortBy?: 'price' | 'rating' | 'newest';
}

export interface ProductsState {
    items: Product[];
    loading: boolean;
    error: string | null;
    filters: ProductFilters;
}
