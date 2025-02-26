import React, { useState, useEffect, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { Product } from '../../types/product';
import { CartContext } from '../../context/CartContext';
import styles from './ProductPage.module.scss';

interface ProductPageProps {
    products: Product[];
}

const API_URL = import.meta.env.PROD 
  ? 'https://tiktok-shop-backend-g9c7.onrender.com'
  : 'http://localhost:3001';

// Helper function to construct proper image URLs
const getImageUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    } else {
        return `${API_URL}${url}`;
    }
};

export const ProductPage: React.FC<ProductPageProps> = ({ products }) => {
    const { productId } = useParams<{ productId: string }>();
    const product = products.find(p => p.id === productId);

    const { addToCart } = useContext(CartContext);

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

    // Compute the image index for main image display
    const imageIndex = product.videoUrl ? selectedImageIndex - 1 : selectedImageIndex;
    const mainImageUrl = product.images[imageIndex] ? getImageUrl(product.images[imageIndex]) : '';

    return (
        <div className={styles.productPage}>
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
        </div>
    );
};

export default ProductPage; 