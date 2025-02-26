import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import * as fs from 'fs';
import { Product } from './types';

const app = express();
const port = process.env.PORT || 3001;

// Middleware
app.use(cors({
    origin: process.env.NODE_ENV === 'production' 
        ? ['https://orders-app.onrender.com']
        : ['http://localhost:5173', 'http://localhost:3000'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Welcome route
app.get('/', (req, res) => {
    res.json({ message: 'TikTok Shop API is running!' });
});

// Test route for health check
app.get('/api', (req, res) => {
    res.json({ status: 'API is running' });
});

// Configure multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const dir = 'uploads';
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir);
        }
        cb(null, dir);
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});

const upload = multer({ storage });

// Load products from JSON file
const productsFile = path.join(__dirname, 'products.json');
let products: Product[] = [];

try {
    if (fs.existsSync(productsFile)) {
        const data = fs.readFileSync(productsFile, 'utf8');
        products = JSON.parse(data);
    }
} catch (error) {
    console.error('Error loading products:', error);
    // Initialize with empty array if file doesn't exist
    products = [];
}

// Save products to JSON file
const saveProducts = () => {
    try {
        fs.writeFileSync(productsFile, JSON.stringify(products, null, 2));
    } catch (error) {
        console.error('Error saving products:', error);
    }
};

// Routes
app.get('/api/products', (req, res) => {
    res.json(products);
});

app.post('/api/products', upload.fields([
    { name: 'images', maxCount: 5 },
    { name: 'video', maxCount: 1 }
]), (req, res) => {
    try {
        const productData = JSON.parse(req.body.product);
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        // Process uploaded files
        const imageUrls = files['images']?.map(file => `/uploads/${file.filename}`) || [];
        const videoUrl = files['video']?.[0] ? `/uploads/${files['video'][0].filename}` : undefined;

        const newProduct: Product = {
            ...productData,
            id: Date.now().toString(),
            images: imageUrls,
            videoUrl,
            createdAt: new Date().toISOString(),
            rating: 0,
            reviews: []
        };

        products.push(newProduct);
        saveProducts();

        res.status(201).json(newProduct);
    } catch (error) {
        console.error('Error creating product:', error);
        res.status(500).json({ error: 'Failed to create product' });
    }
});

app.get('/api/products/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (product) {
        res.json(product);
    } else {
        res.status(404).json({ error: 'Product not found' });
    }
});

// Start server
app.listen(port, () => {
    console.log(`Server running on port ${port}`);
}); 