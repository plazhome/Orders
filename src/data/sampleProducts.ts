import { Product } from '../types/product';

export const sampleProducts: Product[] = [
    {
        id: '1',
        title: 'Trendy Summer Dress',
        description: 'Light and comfortable summer dress perfect for any occasion',
        price: 49.99,
        images: [
            '/images/dress-1.jpg',
            '/images/dress-2.jpg',
            '/images/dress-3.jpg'
        ],
        videoUrl: '/videos/dress-preview.mp4',
        category: 'Fashion',
        tags: ['dress', 'summer', 'trendy'],
        stock: 50,
        rating: 4.5,
        reviews: [
            {
                id: 'r1',
                userId: 'u1',
                userName: 'Sarah',
                rating: 5,
                comment: 'Love this dress! The material is so comfortable.',
                createdAt: '2024-02-20T10:00:00Z',
                helpful: 15
            }
        ],
        createdAt: '2024-02-01T08:00:00Z',
        seller: {
            id: 's1',
            name: 'Fashion Boutique',
            avatar: '/images/seller-1.jpg'
        }
    },
    {
        id: '2',
        title: 'Smart Watch Pro',
        description: 'Advanced smartwatch with health tracking features',
        price: 199.99,
        images: [
            '/images/watch-1.jpg',
            '/images/watch-2.jpg'
        ],
        videoUrl: '/videos/watch-demo.mp4',
        category: 'Electronics',
        tags: ['smartwatch', 'tech', 'fitness'],
        stock: 30,
        rating: 4.8,
        reviews: [
            {
                id: 'r2',
                userId: 'u2',
                userName: 'Mike',
                rating: 5,
                comment: 'Great battery life and accurate fitness tracking!',
                createdAt: '2024-02-22T15:30:00Z',
                helpful: 8
            }
        ],
        createdAt: '2024-02-10T09:00:00Z',
        seller: {
            id: 's2',
            name: 'Tech Haven',
            avatar: '/images/seller-2.jpg'
        }
    }
]; 