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

export const backupProducts = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

        const products = await Product.find();
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const backupPath = path.join(backupDir, `products-backup-${timestamp}.json`);

        fs.writeFileSync(backupPath, JSON.stringify(products, null, 2));
        console.log(`Backup created at: ${backupPath}`);

        await mongoose.disconnect();
    } catch (error) {
        console.error('Backup failed:', error);
        process.exit(1);
    }
};

export const restoreProducts = async (backupFile: string) => {
    try {
        await mongoose.connect(process.env.MONGODB_URI as string);
        console.log('Connected to MongoDB');

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

        await mongoose.disconnect();
    } catch (error) {
        console.error('Restore failed:', error);
        process.exit(1);
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