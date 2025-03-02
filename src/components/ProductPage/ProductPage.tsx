import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Product } from '../../types/product';
import { CartContext } from '../../context/CartContext';
import { useAdmin } from '../../context/AdminContext';
import styles from './ProductPage.module.scss';

interface ProductPageProps {
    products: Product[];
    onProductsChange: () => Promise<void>;
}

// API URL based on environment
const API_URL = import.meta.env.PROD 
  ? 'https://tiktok-shop-backend.onrender.com/api'
  : 'http://localhost:3001/api';

// Helper function to construct proper image URLs
const getImageUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    } else {
        return `${API_URL}${url}`;
    }
};

export const ProductPage: React.FC<ProductPageProps> = ({ products, onProductsChange }) => {
    const { productId } = useParams<{ productId: string }>();
    const navigate = useNavigate();
    const { isAdmin } = useAdmin();
    const product = products.find(p => p.id === productId);
    const { addToCart } = useContext(CartContext);
    const [isEditing, setIsEditing] = useState(false);
    const [editForm, setEditForm] = useState({
        title: '',
        description: '',
        price: '',
        category: '',
        tags: '',
        stock: ''
    });
    const [images, setImages] = useState<File[]>([]);

    useEffect(() => {
        if (product) {
            setEditForm({
                title: product.title,
                description: product.description,
                price: product.price.toString(),
                category: product.category,
                tags: product.tags.join(', '),
                stock: product.stock.toString()
            });
        }
    }, [product]);

    if (!product) {
        return <div className={styles.error}>Product not found</div>;
    }

    // Set initial selected index: if video exists, default to first image (index 1) so that video (index 0) is not default.
    const initialIndex = product.videoUrl ? 1 : 0;
    const [selectedImageIndex, setSelectedImageIndex] = useState(initialIndex);
    const [quantity, setQuantity] = useState(1);

    const handleQuantityChange = (newQuantity: number) => {
        if (newQuantity >= 1 && newQuantity <= product.stock) {
            setQuantity(newQuantity);
        }
    };

    const handleAddToCart = () => {
        addToCart(product, quantity);
    };

    const handleEdit = async (e: React.FormEvent) => {
        e.preventDefault();
        const formData = new FormData();
        
        const productData = {
            title: editForm.title,
            description: editForm.description,
            price: parseFloat(editForm.price),
            category: editForm.category,
            tags: editForm.tags.split(',').map(tag => tag.trim()),
            stock: parseInt(editForm.stock)
        };

        formData.append('product', JSON.stringify(productData));
        
        images.forEach(image => {
            formData.append('images', image);
        });

        try {
            const response = await fetch(`${API_URL}/products/${productId}`, {
                method: 'PUT',
                body: formData
            });

            if (!response.ok) throw new Error('Failed to update product');

            // Refresh the products list
            await onProductsChange();
            
            // Navigate back to product listing
            navigate('/');
        } catch (error) {
            console.error('Error updating product:', error);
        }
    };

    const handleDelete = async () => {
        if (!window.confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/products/${productId}`, {
                method: 'DELETE'
            });

            if (!response.ok) throw new Error('Failed to delete product');

            // Refresh the products list
            await onProductsChange();
            
            // Navigate back to product listing
            navigate('/');
        } catch (error) {
            console.error('Error deleting product:', error);
        }
    };

    // Compute the image index for main image display
    const imageIndex = product.videoUrl ? selectedImageIndex - 1 : selectedImageIndex;
    const mainImageUrl = product.images[imageIndex] ? getImageUrl(product.images[imageIndex]) : '';

    return (
        <div className={styles.productPage}>
            {isAdmin && (
                <div className={styles.adminControls}>
                    <button onClick={() => setIsEditing(!isEditing)}>
                        {isEditing ? 'Cancel Edit' : 'Edit Product'}
                    </button>
                    <button onClick={handleDelete} className={styles.deleteButton}>
                        Delete Product
                    </button>
                </div>
            )}

            {isEditing ? (
                <form onSubmit={handleEdit} className={styles.editForm}>
                    <div className={styles.formGroup}>
                        <label>Title</label>
                        <input
                            type="text"
                            value={editForm.title}
                            onChange={e => setEditForm({...editForm, title: e.target.value})}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Description</label>
                        <textarea
                            value={editForm.description}
                            onChange={e => setEditForm({...editForm, description: e.target.value})}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Price</label>
                        <input
                            type="number"
                            step="0.01"
                            value={editForm.price}
                            onChange={e => setEditForm({...editForm, price: e.target.value})}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Category</label>
                        <input
                            type="text"
                            value={editForm.category}
                            onChange={e => setEditForm({...editForm, category: e.target.value})}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Tags (comma-separated)</label>
                        <input
                            type="text"
                            value={editForm.tags}
                            onChange={e => setEditForm({...editForm, tags: e.target.value})}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>Stock</label>
                        <input
                            type="number"
                            value={editForm.stock}
                            onChange={e => setEditForm({...editForm, stock: e.target.value})}
                            required
                        />
                    </div>

                    <div className={styles.formGroup}>
                        <label>New Images (optional)</label>
                        <input
                            type="file"
                            multiple
                            accept="image/*"
                            onChange={e => setImages(Array.from(e.target.files || []))}
                        />
                    </div>

                    <button type="submit" className={styles.submitButton}>
                        Save Changes
                    </button>
                </form>
            ) : (
                <>
                    <div className={styles.mediaSection}>
                        <div className={styles.mainMedia}>
                            {selectedImageIndex === 0 && product.videoUrl ? (
                                <video
                                    src={product.videoUrl}
                                    controls
                                    autoPlay
                                    loop
                                    muted
                                    playsInline
                                    className={styles.video}
                                />
                            ) : (
                                <img
                                    src={mainImageUrl}
                                    alt={product.title}
                                    className={styles.mainImage}
                                />
                            )}
                        </div>
                        <div className={styles.thumbnails}>
                            {product.videoUrl && (
                                <div
                                    className={`${styles.thumbnail} ${selectedImageIndex === 0 ? styles.active : ''}`}
                                    onClick={() => setSelectedImageIndex(0)}
                                >
                                    <video src={product.videoUrl} muted />
                                    <div className={styles.playIcon}>▶</div>
                                </div>
                            )}
                            {product.images.map((image, index) => (
                                <div
                                    key={index}
                                    className={`${styles.thumbnail} ${
                                        selectedImageIndex === (product.videoUrl ? index + 1 : index) ? styles.active : ''
                                    }`}
                                    onClick={() => setSelectedImageIndex(product.videoUrl ? index + 1 : index)}
                                >
                                    <img src={getImageUrl(image)} alt={`${product.title} ${index + 1}`} />
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className={styles.infoSection}>
                        <div className={styles.header}>
                            <h1>{product.title}</h1>
                            <div className={styles.price}>€{product.price}</div>
                        </div>

                        <p className={styles.description}>{product.description}</p>

                        <div className={styles.tags}>
                            {product.tags.map(tag => (
                                <span key={tag} className={styles.tag}>#{tag}</span>
                            ))}
                        </div>

                        <div className={styles.purchaseSection}>
                            <div className={styles.quantity}>
                                <button 
                                    onClick={() => handleQuantityChange(quantity - 1)}
                                    disabled={quantity <= 1}
                                >
                                    -
                                </button>
                                <input
                                    type="number"
                                    value={quantity}
                                    onChange={(e) => handleQuantityChange(parseInt(e.target.value) || 1)}
                                    min="1"
                                    max={product.stock}
                                />
                                <button 
                                    onClick={() => handleQuantityChange(quantity + 1)}
                                    disabled={quantity >= product.stock}
                                >
                                    +
                                </button>
                            </div>
                            <button 
                                className={styles.addToCart}
                                onClick={handleAddToCart}
                                disabled={product.stock === 0}
                            >
                                {product.stock > 0 ? 'Add to Cart' : 'Out of Stock'}
                            </button>
                        </div>

                        <div className={styles.reviews}>
                            <h2>Reviews ({product.reviews.length})</h2>
                            {product.reviews.map(review => (
                                <div key={review.id} className={styles.review}>
                                    <div className={styles.reviewHeader}>
                                        <span className={styles.reviewerName}>{review.userName}</span>
                                        <span className={styles.reviewRating}>
                                            {'★'.repeat(review.rating)}
                                            {'☆'.repeat(5 - review.rating)}
                                        </span>
                                    </div>
                                    <p className={styles.reviewComment}>{review.comment}</p>
                                    <div className={styles.reviewMeta}>
                                        <span className={styles.reviewDate}>
                                            {new Date(review.createdAt).toLocaleDateString()}
                                        </span>
                                        <span className={styles.helpful}>
                                            {review.helpful} found this helpful
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </div>
    );
};

export default ProductPage; 