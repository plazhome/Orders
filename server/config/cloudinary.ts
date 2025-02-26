import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
});

export const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: 'tiktok-shop',
        allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'mp4'],
        resource_type: 'auto'
    } as any
}); 