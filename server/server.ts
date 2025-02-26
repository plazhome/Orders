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
    useNewUrlParser: true,
    useUnifiedTopology: true,
    serverSelectionTimeoutMS: 5000,
    socketTimeoutMS: 45000,
};

// MongoDB connection function
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('MongoDB Connected:', conn.connection.host);
        
        // Check if products exist
        const existingProducts = await Product.find();
        if (existingProducts.length === 0) {
            // Insert sample product if no products exist
            await Product.create(sampleProduct);
            console.log('Sample product added successfully');
        }

        // Create automatic backup
        await backupProducts();
        console.log('Automatic backup created');

        // Schedule daily backups at midnight
        setInterval(async () => {
            const now = new Date();
            if (now.getHours() === 0 && now.getMinutes() === 0) {
                await backupProducts();
                console.log('Daily backup created');
            }
        }, 60000); // Check every minute

    } catch (error) {
        console.error('MongoDB connection error:', error);
        // Retry connection after 5 seconds
        setTimeout(connectDB, 5000);
    }
};

// Handle MongoDB connection errors
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected. Attempting to reconnect...');
    connectDB();
});

// Connect to MongoDB
connectDB();

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

// Start server
app.listen(port, '0.0.0.0', () => {
    console.log(`Server running on port ${port}`);
    console.log('Environment:', process.env.NODE_ENV);
    console.log('MongoDB URI:', process.env.MONGODB_URI ? 'Set' : 'Not set');
    console.log('Cloudinary Config:', process.env.CLOUDINARY_CLOUD_NAME ? 'Set' : 'Not set');
}); 