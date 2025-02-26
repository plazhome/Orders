import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { Product } from '../../types/product';
import { CartContext } from '../../context/CartContext';
import styles from './ProductListing.module.scss';

interface ProductListingProps {
    products: Product[];
}

const API_URL = import.meta.env.PROD 
  ? 'https://tiktok-shop-backend-g9c7.onrender.com'
  : 'http://localhost:3001';

const getImageUrl = (url: string) => {
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    } else {
        return `${API_URL}${url}`;
    }
};

export const ProductListing: React.FC<ProductListingProps> = ({ products }) => {
    const navigate = useNavigate();
    const { addToCart } = useContext(CartContext);
    const [activeIndex, setActiveIndex] = useState(0);

    const handleProductClick = (productId: string) => {
        navigate(`/product/${productId}`);
    };

    const handleAddToCart = (product: Product, e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        // Add product to cart with a default quantity of 1
        addToCart(product, 1);
    };

    return (
        <div className={styles.productFeed}>
            {products.map((product, index) => (
                <div 
                    key={product.id}
                    className={styles.productCard}
                    onClick={() => handleProductClick(product.id)}
                >
                    <div className={styles.mediaContainer}>
                        {product.videoUrl ? (
                            <video
                                className={styles.productVideo}
                                src={product.videoUrl}
                                loop
                                muted
                                playsInline
                                autoPlay={index === activeIndex}
                            />
                        ) : (
                            <img
                                src={getImageUrl(product.images[0])}
                                alt={product.title}
                                className={styles.productImage}
                            />
                        )}
                        <div className={styles.productInfo}>
                            <div className={styles.productHeader}>
                                <h3>{product.title}</h3>
                                <span className={styles.price}>€{product.price}</span>
                            </div>
                            <p className={styles.description}>{product.description}</p>
                            <div className={styles.stats}>
                                <span className={styles.stock}>
                                    {product.stock} in stock
                                </span>
                            </div>
                        </div>
                        <div className={styles.actions}>
                            <button 
                                className={styles.actionButton}
                                onClick={(e) => handleAddToCart(product, e)}
                            >
                                Add to Cart
                            </button>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}; 