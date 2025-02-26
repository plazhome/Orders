import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './models/Product';

dotenv.config();

const sampleProducts = [
    {
        title: 'Test Product',
        description: 'This is a test product to ensure the system is working correctly',
        price: 29.99,
        images: [
            'https://res.cloudinary.com/dxsebqku9/image/upload/v1/tiktok-shop/placeholder.jpg'
        ],
        category: 'Test',
        tags: ['test', 'sample'],
        stock: 10,
        rating: 5,
        reviews: [],
        seller: {
            id: 'test-seller',
            name: 'Test Seller',
            avatar: 'https://res.cloudinary.com/dxsebqku9/image/upload/v1/tiktok-shop/default-avatar.jpg'
        }
    }
];

const seedDatabase = async () => {
    try {
        // Connect to MongoDB
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        // Check if products exist
        const existingProducts = await Product.find();
        if (existingProducts.length === 0) {
            // Insert sample products only if no products exist
            await Product.insertMany(sampleProducts);
            console.log('Sample products added successfully');
        } else {
            console.log('Products already exist, skipping seed');
        }

        await mongoose.disconnect();
        console.log('Database seeding completed');
    } catch (error) {
        console.error('Error seeding database:', error);
        process.exit(1);
    }
};

seedDatabase(); 