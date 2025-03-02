import express from 'express';
import cors from 'cors';
import multer from 'multer';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { storage } from './config/cloudinary';
import { Product } from './models/Product';
import { backupProducts } from './backup';

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

// MongoDB connection options
const mongooseOptions = {
    serverSelectionTimeoutMS: 30000,
    socketTimeoutMS: 45000,
    family: 4,
    maxPoolSize: 10,
    connectTimeoutMS: 30000,
    retryWrites: true,
    heartbeatFrequencyMS: 2000
};

// MongoDB connection function
const connectDB = async () => {
    try {
        // Check if already connecting or connected
        if (mongoose.connection.readyState === 1 || mongoose.connection.readyState === 2) {
            console.log('MongoDB already connected or connecting');
            return;
        }

        console.log('Attempting to connect to MongoDB...');
        const conn = await mongoose.connect(process.env.MONGODB_URI as string, mongooseOptions);
        console.log('MongoDB Connected Successfully');
        console.log('Connection Host:', conn.connection.host);
        console.log('Database Name:', conn.connection.name);
        console.log('Connection State:', conn.connection.readyState);
        
        // Check if products exist
        console.log('Checking for existing products...');
        const existingProducts = await Product.find();
        console.log(`Found ${existingProducts.length} existing products`);
        
        if (existingProducts.length === 0) {
            console.log('No products found, adding sample product...');
            await Product.create(sampleProduct);
            console.log('Sample product added successfully');
            
            // Create backup after adding sample product
            console.log('Creating initial backup...');
            await backupProducts();
            console.log('Initial backup created successfully');
        }

        // Schedule daily backups at midnight
        setInterval(async () => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                console.log('Creating scheduled daily backup...');
                await backupProducts();
                console.log('Daily backup created successfully');
            }
        }, 3600000); // Check every hour instead of every minute

    } catch (error) {
        console.error('MongoDB connection error details:', {
            error: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : undefined,
            timestamp: new Date().toISOString()
        });
        // Retry connection after 30 seconds
        console.log('Retrying connection in 30 seconds...');
        setTimeout(connectDB, 30000);
    }
};

// Handle MongoDB connection errors
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error event:', {
        error: err.message,
        stack: err.stack,
        timestamp: new Date().toISOString()
    });
});

let reconnectTimeout: NodeJS.Timeout | null = null;

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected event triggered');
    console.log('Current connection state:', mongoose.connection.readyState);
    
    // Clear any existing reconnection timeout
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
    }
    
    // Set a new reconnection timeout
    console.log('Attempting to reconnect in 5 seconds...');
    reconnectTimeout = setTimeout(() => {
        console.log('Attempting to reconnect...');
        connectDB();
    }, 5000);
});

mongoose.connection.on('connected', () => {
    console.log('MongoDB connected event triggered');
    console.log('Connection state:', mongoose.connection.readyState);
    
    // Clear any existing reconnection timeout
    if (reconnectTimeout) {
        clearTimeout(reconnectTimeout);
        reconnectTimeout = null;
    }
});

// Connect to MongoDB
connectDB();

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://tiktok-shop-frontend.onrender.com', 'https://orders-app-431y.onrender.com']
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

// Health check endpoint
app.get('/api/health', (req, res) => {
    const dbStatus = mongoose.connection.readyState === 1 ? 'connected' : 'disconnected';
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: dbStatus,
        environment: process.env.NODE_ENV || 'development'
    });
});

// Check MongoDB connection middleware
const checkDBConnection = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    if (mongoose.connection.readyState !== 1) {
        return res.status(503).json({ error: 'Database connection not ready' });
    }
    next();
};

// Apply DB connection check to all /api/products routes
app.use('/api/products', checkDBConnection);

// Product Management Routes
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
        await backupProducts(); // Create backup after adding product
        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

// New route for updating a product
app.put('/api/products/:id', upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 }
]), async (req, res) => {
    try {
        const productData = JSON.parse(req.body.product);
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // Get new Cloudinary URLs if files were uploaded
        const imageUrls = files['images']?.map(file => file.path);
        const videoUrl = files['video']?.[0]?.path;

        // Only update media URLs if new files were uploaded
        const updateData = {
            ...productData,
            ...(imageUrls && { images: imageUrls }),
            ...(videoUrl && { videoUrl })
        };

        const updatedProduct = await Product.findByIdAndUpdate(
            req.params.id,
            updateData,
            { new: true }
        );

        if (!updatedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await backupProducts(); // Create backup after updating product
        res.json(updatedProduct);
    } catch (error) {
        console.error('Error updating product:', error);
        res.status(500).json({ error: 'Failed to update product' });
    }
});

// New route for deleting a product
app.delete('/api/products/:id', async (req, res) => {
    try {
        const deletedProduct = await Product.findByIdAndDelete(req.params.id);
        
        if (!deletedProduct) {
            return res.status(404).json({ error: 'Product not found' });
        }

        await backupProducts(); // Create backup after deleting product
        res.json({ message: 'Product deleted successfully' });
    } catch (error) {
        console.error('Error deleting product:', error);
        res.status(500).json({ error: 'Failed to delete product' });
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

// Debug endpoint
app.get('/api/debug', (req, res) => {
    res.json({ 
        status: 'ok',
        message: 'Debug endpoint is working',
        timestamp: new Date().toISOString()
    });
});

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    console.log('Cloudinary Config:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set');
}); 