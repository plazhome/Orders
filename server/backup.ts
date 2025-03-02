import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from './models/Product';

dotenv.config();

const backupDir = path.join(__dirname, 'backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
}

// Clean up old backups (keep only last 7 days)
const cleanupOldBackups = () => {
    try {
        const files = fs.readdirSync(backupDir);
        const now = Date.now();
        const sevenDaysAgo = now - (7 * 24 * 60 * 60 * 1000);

        files.forEach(file => {
            const filePath = path.join(backupDir, file);
            const stats = fs.statSync(filePath);
            if (stats.birthtime.getTime() < sevenDaysAgo) {
                fs.unlinkSync(filePath);
                console.log(`Deleted old backup: ${file}`);
            }
        });
    } catch (error) {
        console.error('Error cleaning up old backups:', error);
    }
};

export const backupProducts = async () => {
    // Don't create a new connection if we're already connected
    const wasConnected = mongoose.connection.readyState === 1;
    
    try {
        if (!wasConnected) {
            await mongoose.connect(process.env.MONGODB_URI as string);
            console.log('Connected to MongoDB');
        }

        const products = await Product.find();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `products-backup-${timestamp}.json`);

        fs.writeFileSync(backupPath, JSON.stringify(products, null, 2));
        console.log(`Backup created at: ${backupPath}`);

        // Clean up old backups
        cleanupOldBackups();

        if (!wasConnected) {
            await mongoose.disconnect();
        }
        
        return true;
    } catch (error) {
        console.error('Backup failed:', error);
        if (!wasConnected && mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        return false;
    }
};

export const restoreProducts = async (backupFile: string) => {
    const wasConnected = mongoose.connection.readyState === 1;
    
    try {
        if (!wasConnected) {
            await mongoose.connect(process.env.MONGODB_URI as string);
            console.log('Connected to MongoDB');
        }

        const backupPath = path.join(backupDir, backupFile);
        const products = JSON.parse(fs.readFileSync(backupPath, 'utf-8'));

        // Only restore if database is empty
        const existingProducts = await Product.find();
        if (existingProducts.length === 0) {
            await Product.insertMany(products);
            console.log('Products restored successfully');
        } else {
            console.log('Database not empty, skipping restore');
        }

        if (!wasConnected) {
            await mongoose.disconnect();
        }
        
        return true;
    } catch (error) {
        console.error('Restore failed:', error);
        if (!wasConnected && mongoose.connection.readyState === 1) {
            await mongoose.disconnect();
        }
        return false;
    }
};

// If running directly (not imported)
if (require.main === module) {
    const action = process.argv[2];
    const backupFile = process.argv[3];

    if (action === 'backup') {
        backupProducts();
    } else if (action === 'restore' && backupFile) {
        restoreProducts(backupFile);
    } else {
        console.log('Usage:');
        console.log('  Backup:  ts-node backup.ts backup');
        console.log('  Restore: ts-node backup.ts restore <backup-file>');
    }
} 