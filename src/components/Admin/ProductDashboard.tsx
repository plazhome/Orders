import React, { useState, useEffect } from 'react';
import { Product } from '../../types/product';
import styles from './ProductDashboard.module.scss';
import { useNavigate } from 'react-router-dom';

const API_URL = import.meta.env.PROD 
  ? 'https://tiktok-shop-backend-g9c7.onrender.com/api'
  : 'http://localhost:3001/api';

interface ProductDashboardProps {
    onProductsChange: () => Promise<void>;
}

export const ProductDashboard: React.FC<ProductDashboardProps> = ({ onProductsChange }) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'title' | 'price' | 'stock' | 'date'>('date');
    const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
    const productsPerPage = 10;
    const navigate = useNavigate();

    // Fetch products
    const fetchProducts = async () => {
        try {
            setLoading(true);
            const response = await fetch(`${API_URL}/products`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch products');
            }
            
            const data = await response.json();
            setProducts(data);
            setError('');
        } catch (err) {
            console.error('Error fetching products:', err);
            setError('Failed to fetch products. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    // Handle product deletion
    const handleDeleteProduct = async (productId: string) => {
        if (!window.confirm('Are you sure you want to delete this product?')) {
            return;
        }

        try {
            const response = await fetch(`${API_URL}/products/${productId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                throw new Error('Failed to delete product');
            }

            // Refresh products list
            await fetchProducts();
            await onProductsChange();
            setSelectedProducts(prevSelected => 
                prevSelected.filter(id => id !== productId)
            );
        } catch (err) {
            console.error('Error deleting product:', err);
            setError('Failed to delete product. Please try again.');
        }
    };

    // Handle bulk deletion
    const handleBulkDelete = async () => {
        if (selectedProducts.length === 0) {
            return;
        }

        if (!window.confirm(`Are you sure you want to delete ${selectedProducts.length} products?`)) {
            return;
        }

        try {
            // Delete each selected product
            const deletePromises = selectedProducts.map(productId => 
                fetch(`${API_URL}/products/${productId}`, {
                    method: 'DELETE'
                })
            );

            await Promise.all(deletePromises);
            
            // Refresh products list
            await fetchProducts();
            await onProductsChange();
            setSelectedProducts([]);
        } catch (err) {
            console.error('Error deleting products:', err);
            setError('Failed to delete some products. Please try again.');
        }
    };

    // Navigate to edit product page
    const handleEditProduct = (productId: string) => {
        navigate(`/product/${productId}`);
    };

    // Navigate to add product page
    const handleAddProduct = () => {
        navigate('/admin');
    };

    // Handle checkbox selection
    const handleSelectProduct = (productId: string) => {
        setSelectedProducts(prevSelected => {
            if (prevSelected.includes(productId)) {
                return prevSelected.filter(id => id !== productId);
            } else {
                return [...prevSelected, productId];
            }
        });
    };

    // Handle "select all" checkbox
    const handleSelectAll = () => {
        if (selectedProducts.length === filteredProducts.length) {
            setSelectedProducts([]);
        } else {
            setSelectedProducts(filteredProducts.map(product => product.id));
        }
    };

    // Filter products based on search term
    const filteredProducts = products.filter(product => 
        product.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
    );

    // Sort products
    const sortedProducts = [...filteredProducts].sort((a, b) => {
        if (sortBy === 'title') {
            return sortDirection === 'asc' 
                ? a.title.localeCompare(b.title)
                : b.title.localeCompare(a.title);
        } else if (sortBy === 'price') {
            return sortDirection === 'asc' 
                ? a.price - b.price
                : b.price - a.price;
        } else if (sortBy === 'stock') {
            return sortDirection === 'asc' 
                ? a.stock - b.stock
                : b.stock - a.stock;
        } else { // date
            const dateA = new Date(a.createdAt).getTime();
            const dateB = new Date(b.createdAt).getTime();
            return sortDirection === 'asc' 
                ? dateA - dateB
                : dateB - dateA;
        }
    });

    // Calculate pagination
    const indexOfLastProduct = currentPage * productsPerPage;
    const indexOfFirstProduct = indexOfLastProduct - productsPerPage;
    const currentProducts = sortedProducts.slice(indexOfFirstProduct, indexOfLastProduct);
    const totalPages = Math.ceil(sortedProducts.length / productsPerPage);

    // Handle pagination
    const handlePageChange = (pageNumber: number) => {
        setCurrentPage(pageNumber);
    };

    // Handle sort change
    const handleSortChange = (column: 'title' | 'price' | 'stock' | 'date') => {
        if (sortBy === column) {
            // Toggle direction if clicking the same column
            setSortDirection(prevDirection => prevDirection === 'asc' ? 'desc' : 'asc');
        } else {
            // Set new column and default to descending
            setSortBy(column);
            setSortDirection('desc');
        }
    };

    // Format date for display
    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    // Get sort indicator
    const getSortIndicator = (column: 'title' | 'price' | 'stock' | 'date') => {
        if (sortBy !== column) return null;
        return sortDirection === 'asc' ? '↑' : '↓';
    };

    // Render pagination controls
    const renderPagination = () => {
        if (totalPages <= 1) return null;

        const pages = [];
        // Always show first page
        pages.push(
            <button
                key={1}
                onClick={() => handlePageChange(1)}
                className={currentPage === 1 ? styles.activePage : ''}
            >
                1
            </button>
        );

        // Calculate range of pages to show
        let startPage = Math.max(2, currentPage - 1);
        let endPage = Math.min(totalPages - 1, currentPage + 1);

        // Add ellipsis if needed
        if (startPage > 2) {
            pages.push(<span key="ellipsis1">...</span>);
        }

        // Add middle pages
        for (let i = startPage; i <= endPage; i++) {
            pages.push(
                <button
                    key={i}
                    onClick={() => handlePageChange(i)}
                    className={currentPage === i ? styles.activePage : ''}
                >
                    {i}
                </button>
            );
        }

        // Add ellipsis if needed
        if (endPage < totalPages - 1) {
            pages.push(<span key="ellipsis2">...</span>);
        }

        // Always show last page if there's more than one page
        if (totalPages > 1) {
            pages.push(
                <button
                    key={totalPages}
                    onClick={() => handlePageChange(totalPages)}
                    className={currentPage === totalPages ? styles.activePage : ''}
                >
                    {totalPages}
                </button>
            );
        }

        return (
            <div className={styles.pagination}>
                <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={styles.paginationArrow}
                >
                    &lt;
                </button>
                {pages}
                <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={styles.paginationArrow}
                >
                    &gt;
                </button>
            </div>
        );
    };

    return (
        <div className={styles.productDashboard}>
            <div className={styles.dashboardHeader}>
                <h1>Product Management</h1>
                <div className={styles.actions}>
                    <button 
                        className={styles.addButton}
                        onClick={handleAddProduct}
                    >
                        Add New Product
                    </button>
                    {selectedProducts.length > 0 && (
                        <button 
                            className={styles.deleteButton}
                            onClick={handleBulkDelete}
                        >
                            Delete Selected ({selectedProducts.length})
                        </button>
                    )}
                </div>
            </div>

            <div className={styles.filters}>
                <div className={styles.search}>
                    <input
                        type="text"
                        placeholder="Search products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <div className={styles.productStats}>
                    <span>Total Products: {products.length}</span>
                    <span>Showing: {indexOfFirstProduct + 1}-{Math.min(indexOfLastProduct, sortedProducts.length)} of {sortedProducts.length}</span>
                </div>
            </div>

            {error && <div className={styles.error}>{error}</div>}

            {loading ? (
                <div className={styles.loading}>
                    <div className={styles.spinner}></div>
                    <p>Loading products...</p>
                </div>
            ) : currentProducts.length === 0 ? (
                <div className={styles.noProducts}>
                    <p>No products found. {searchTerm ? 'Try a different search term.' : 'Add some products to get started.'}</p>
                </div>
            ) : (
                <>
                    <div className={styles.mobileScrollHint}>
                        <span>Swipe to see more →</span>
                    </div>
                    <div className={styles.tableContainer}>
                        <table className={styles.productTable}>
                            <thead>
                                <tr>
                                    <th className={styles.checkboxCell}>
                                        <input
                                            type="checkbox"
                                            checked={selectedProducts.length === filteredProducts.length && filteredProducts.length > 0}
                                            onChange={handleSelectAll}
                                            className={styles.checkbox}
                                        />
                                    </th>
                                    <th className={styles.imageCell}>Image</th>
                                    <th 
                                        className={styles.sortableHeader}
                                        onClick={() => handleSortChange('title')}
                                    >
                                        Title {getSortIndicator('title')}
                                    </th>
                                    <th 
                                        className={styles.sortableHeader}
                                        onClick={() => handleSortChange('price')}
                                    >
                                        Price {getSortIndicator('price')}
                                    </th>
                                    <th>Category</th>
                                    <th 
                                        className={styles.sortableHeader}
                                        onClick={() => handleSortChange('stock')}
                                    >
                                        Stock {getSortIndicator('stock')}
                                    </th>
                                    <th 
                                        className={styles.sortableHeader}
                                        onClick={() => handleSortChange('date')}
                                    >
                                        Created {getSortIndicator('date')}
                                    </th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {currentProducts.map(product => (
                                    <tr key={product.id}>
                                        <td className={styles.checkboxCell}>
                                            <input
                                                type="checkbox"
                                                checked={selectedProducts.includes(product.id)}
                                                onChange={() => handleSelectProduct(product.id)}
                                                className={styles.checkbox}
                                            />
                                        </td>
                                        <td className={styles.imageCell}>
                                            <img 
                                                src={product.images[0]}
                                                alt={product.title}
                                                className={styles.productThumbnail}
                                            />
                                        </td>
                                        <td>{product.title}</td>
                                        <td className={styles.priceCell}>€{product.price.toFixed(2)}</td>
                                        <td>{product.category}</td>
                                        <td className={styles.stockCell}>{product.stock}</td>
                                        <td>{formatDate(product.createdAt)}</td>
                                        <td className={styles.actionsCell}>
                                            <button 
                                                className={styles.editButton}
                                                onClick={() => handleEditProduct(product.id)}
                                            >
                                                Edit
                                            </button>
                                            <button 
                                                className={styles.deleteButton}
                                                onClick={() => handleDeleteProduct(product.id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {renderPagination()}
                </>
            )}
        </div>
    );
}; 