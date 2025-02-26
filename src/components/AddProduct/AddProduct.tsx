import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types/product';
import styles from './AddProduct.module.scss';

const API_URL = import.meta.env.PROD 
  ? 'https://orders-api-431y.onrender.com/api'
  : 'http://localhost:3001/api';

export const AddProduct: React.FC = () => {
    const navigate = useNavigate();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const videoInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        tags: '',
        stock: ''
    });

    const [images, setImages] = useState<File[]>([]);
    const [video, setVideo] = useState<File | null>(null);
    const [imagePreviewUrls, setImagePreviewUrls] = useState<string[]>([]);
    const [videoPreviewUrl, setVideoPreviewUrl] = useState<string>('');
    const [error, setError] = useState<string>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files || []);
        if (files.length > 5) {
            setError('Maximum 5 images allowed');
            return;
        }

        const newImageUrls: string[] = [];
        files.forEach(file => {
            const reader = new FileReader();
            reader.onloadend = () => {
                newImageUrls.push(reader.result as string);
                if (newImageUrls.length === files.length) {
                    setImagePreviewUrls(newImageUrls);
                }
            };
            reader.readAsDataURL(file);
        });
        setImages(files);
        setError('');
    };

    const handleVideoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 50 * 1024 * 1024) { // 50MB limit
                setError('Video must be less than 50MB');
                return;
            }
            const reader = new FileReader();
            reader.onloadend = () => {
                setVideoPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
            setVideo(file);
            setError('');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!images.length) {
            setError('At least one image is required');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const formDataToSend = new FormData();
            
            // Append product data
            const productData: Partial<Product> = {
                title: formData.title,
                description: formData.description,
                price: parseFloat(formData.price),
                category: formData.category,
                tags: formData.tags.split(',').map(tag => tag.trim()),
                stock: parseInt(formData.stock),
                seller: {
                    id: 'current-user-id',
                    name: 'Current User',
                    avatar: '/images/default-avatar.jpg'
                }
            };

            formDataToSend.append('product', JSON.stringify(productData));

            // Append images
            images.forEach(image => {
                formDataToSend.append('images', image);
            });

            // Append video if exists
            if (video) {
                formDataToSend.append('video', video);
            }

            const response = await fetch(`${API_URL}/products`, {
                method: 'POST',
                body: formDataToSend
            });

            if (!response.ok) {
                throw new Error('Failed to create product');
            }

            const newProduct = await response.json();
            console.log('Product created:', newProduct);
            
            // Navigate back to product listing
            navigate('/');
        } catch (err) {
            console.error('Error creating product:', err);
            setError(err instanceof Error ? err.message : 'Failed to create product');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="page-container">
            <div className={styles.addProduct}>
                <h1>Add New Product</h1>
                
                {error && <div className={styles.error}>{error}</div>}
                
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                        <label htmlFor="title">Title</label>
                        <input
                            type="text"
                            id="title"
                            name="title"
                            value={formData.title}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="description">Description</label>
                        <textarea
                            id="description"
                            name="description"
                            value={formData.description}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="price">Price</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleInputChange}
                            step="0.01"
                            min="0"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="category">Category</label>
                        <input
                            type="text"
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleInputChange}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="tags">Tags (comma-separated)</label>
                        <input
                            type="text"
                            id="tags"
                            name="tags"
                            value={formData.tags}
                            onChange={handleInputChange}
                            placeholder="e.g., fashion, summer, trendy"
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label htmlFor="stock">Stock Quantity</label>
                        <input
                            type="number"
                            id="stock"
                            name="stock"
                            value={formData.stock}
                            onChange={handleInputChange}
                            min="0"
                            required
                        />
                    </div>

                    <div className={styles.mediaUpload}>
                        <div className={styles.imageUpload}>
                            <label>
                                Product Images (max 5)
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    accept="image/*"
                                    multiple
                                    onChange={handleImageUpload}
                                    className={styles.fileInput}
                                />
                            </label>
                            {imagePreviewUrls.length > 0 && (
                                <div className={styles.previewGrid}>
                                    {imagePreviewUrls.map((url, index) => (
                                        <img 
                                            key={index}
                                            src={url}
                                            alt={`Preview ${index + 1}`}
                                            className={styles.preview}
                                        />
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className={styles.videoUpload}>
                            <label>
                                Product Video (optional)
                                <input
                                    type="file"
                                    ref={videoInputRef}
                                    accept="video/*"
                                    onChange={handleVideoUpload}
                                    className={styles.fileInput}
                                />
                            </label>
                            {videoPreviewUrl && (
                                <video
                                    src={videoPreviewUrl}
                                    controls
                                    className={styles.preview}
                                />
                            )}
                        </div>
                    </div>

                    <button 
                        type="submit" 
                        className={styles.submitButton}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? 'Adding Product...' : 'Add Product'}
                    </button>
                </form>
            </div>
        </div>
    );
}; 