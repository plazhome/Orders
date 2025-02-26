import express from 'express';
import cors from 'cors';
import multer from 'multer';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { storage } from './config/cloudinary';
import { Product } from './models/Product';

dotenv.config();

const app = express();
const port = parseInt(process.env.PORT || '3001', 10);

// Sample product for seeding
const sampleProduct = {
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
};

// Connect to MongoDB and seed if needed
mongoose.connect(process.env.MONGODB_URI as string)
    .then(async () => {
        console.log('Connected to MongoDB');
        
        // Check if products exist
        const existingProducts = await Product.find();
        if (existingProducts.length === 0) {
            // Insert sample product if no products exist
            await Product.create(sampleProduct);
            console.log('Sample product added successfully');
        }
    })
    .catch(err => console.error('MongoDB connection error:', err));

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://orders-app-431y.onrender.com', 'https://tiktok-shop-frontend.onrender.com']
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());

// Configure multer with Cloudinary storage
const upload = multer({ storage });

// Welcome route
app.get('/', (req, res) => {
    res.json({ message: 'TikTok Shop API is running!' });
});

// Test route for health check
app.get('/api', (req, res) => {
    res.json({ status: 'API is running' });
});

// Routes
app.get('/api/products', async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).json({ error: 'Failed to fetch products' });
    }
});

app.post('/api/products', upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {
    try {
        const productData = JSON.parse(req.body.product);
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // Get Cloudinary URLs
        const imageUrls = files['images']?.map(file => file.path) || [];
        const videoUrl = files['video']?.[0]?.path;

        const newProduct = new Product({
            ...productData,
            images: imageUrls,
            videoUrl,
            createdAt: new Date().toISOString(),
            rating: 0,
            reviews: []
        });

        await newProduct.save();
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.get('/api/products/:id', async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ error: 'Product not found' });
        }
    } catch (error) {
        console.error('Error fetching product:', error);
        res.status(500).json({ error: 'Failed to fetch product' });
    }
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    console.log('Cloudinary Config:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set');
}); 