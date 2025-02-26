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