import React, { useEffect, useState } from 'react';
import { Category } from '../../categories/category.types';
import { CategoryService } from '../../categories/category.service';
import { Package, Search, ChevronRight, AlertCircle } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { productsApi } from '../../../api/products.api';
import { Produit } from '../../../api/types';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { SoftModal } from '../../../components/ui/SoftModal';
import { SoftInput } from '../../../components/ui/SoftInput';
import { cartApi } from '../../../api/cart.api';
import { toast } from 'react-toastify';

export const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [products, setProducts] = useState<Produit[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);
    const [quantity, setQuantity] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const [cats, prods] = await Promise.all([
                CategoryService.getAllCategories(),
                productsApi.getProduits(),
            ]);
            setCategories(cats);
            setProducts(prods);
        } catch (err: any) {
            setError(err.response?.data?.message || 'Failed to load categories');
        } finally {
            setLoading(false);
        }
    };

    /** Normalize a string for accent-insensitive, case-insensitive matching.
     *  e.g. "Épicerie" → "epicerie", "Aïcha" → "aicha" */
    const normalize = (s: string) =>
        s.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().trim();

    const isSearchActive = searchTerm.trim().length > 0;
    const term = normalize(searchTerm);

    const filteredCategories = isSearchActive
        ? categories.filter(c =>
            normalize(c.nom ?? '').includes(term) ||
            normalize(c.description ?? '').includes(term)
        )
        : categories;

    const filteredProducts = isSearchActive
        ? products.filter(p => normalize(p.nom ?? '').includes(term))
        : [];

    const handleCategoryClick = (categoryName: string) => {
        navigate(`/client/catalog?category=${encodeURIComponent(categoryName)}`);
    };

    const openModal = (product: Produit) => {
        setSelectedProduct(product);
        setQuantity(product.quantiteMinimumCommande || 1);
    };

    const handleAddToCart = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!selectedProduct) return;
        setIsSubmitting(true);
        try {
            await cartApi.ajouter({ produitId: selectedProduct.id, quantite: quantity });
            toast.success('Product added to cart');
            setSelectedProduct(null);
        } catch (e: any) {
            toast.error(e.response?.data?.message || 'Failed to add to cart');
        } finally {
            setIsSubmitting(false);
        }
    };

    const resolveImage = (url: string | undefined) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8088';
        return `${backendUrl}${url}`;
    };

    if (loading) {
        return (
            <div className="d-flex justify-content-center align-items-center" style={{ height: '400px' }}>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Loading...</span>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="alert alert-danger" role="alert">
                {error}
            </div>
        );
    }

    return (
        <div className="container-fluid animation-fade-in">
            {/* Page header */}
            <div className="d-flex justify-content-between align-items-end mb-4 flex-wrap gap-3">
                <div>
                    <h2 className="mb-1 fw-bold text-body">Retail Categories</h2>
                    <p className="text-muted mb-0">Browse products by category</p>
                </div>
                <div className="position-relative" style={{ maxWidth: '300px', width: '100%' }}>
                    <Search className="position-absolute top-50 translate-middle-y text-muted" size={18} style={{ left: '12px' }} />
                    <input
                        type="text"
                        className="soft-input w-100 ps-5"
                        placeholder="Search categories, products..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* Empty search → normal category grid */}
            {!isSearchActive && (
                <div className="row g-4">
                    {categories.map(category => (
                        <div key={category.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                            <div
                                className="soft-card h-100 cursor-pointer overflow-hidden group"
                                onClick={() => handleCategoryClick(category.nom)}
                                style={{ transition: 'all 0.3s ease' }}
                            >
                                <div className="position-relative" style={{ height: '160px', overflow: 'hidden' }}>
                                    {category.image ? (
                                        <img
                                            src={resolveImage(category.image) || 'https://via.placeholder.com/500x320?text=Category'}
                                            alt={category.nom}
                                            className="w-100 h-100 object-fit-cover"
                                            style={{ transition: 'transform 0.5s ease' }}
                                            onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                            onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                        />
                                    ) : (
                                        <div className="w-100 h-100 bg-soft-primary d-flex align-items-center justify-content-center">
                                            <Package size={48} className="text-primary opacity-50" />
                                        </div>
                                    )}
                                    <div className="position-absolute bottom-0 start-0 w-100 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                                        <h5 className="text-white mb-0 fw-bold">{category.nom}</h5>
                                    </div>
                                </div>
                                <div className="p-3 d-flex justify-content-between align-items-center">
                                    <p className="text-muted text-sm mb-0 text-truncate me-2" style={{ fontSize: '0.85rem' }}>
                                        {category.description || 'Explore products in this category'}
                                    </p>
                                    <div className="bg-soft-primary rounded-circle p-1 text-primary">
                                        <ChevronRight size={16} />
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Active search → two distinct result sections */}
            {isSearchActive && (
                <>
                    {/* No results at all */}
                    {filteredCategories.length === 0 && filteredProducts.length === 0 && (
                        <div className="text-center py-5">
                            <div className="d-inline-flex bg-soft-primary p-3 rounded-circle mb-3">
                                <Package size={32} className="text-primary" />
                            </div>
                            <h5>No categories or products found</h5>
                            <p className="text-muted">Try a different search term.</p>
                        </div>
                    )}

                    {/* Matching Categories section */}
                    {filteredCategories.length > 0 && (
                        <div className="mb-5">
                            <h5 className="fw-semibold text-muted mb-3 pb-2 border-bottom">
                                Matching Categories
                                <span className="ms-2 badge bg-soft-primary text-primary" style={{ fontSize: '0.75rem' }}>
                                    {filteredCategories.length}
                                </span>
                            </h5>
                            <div className="row g-4">
                                {filteredCategories.map(category => (
                                    <div key={category.id} className="col-12 col-md-6 col-lg-4 col-xl-3">
                                        <div
                                            className="soft-card h-100 cursor-pointer overflow-hidden group"
                                            onClick={() => handleCategoryClick(category.nom)}
                                            style={{ transition: 'all 0.3s ease' }}
                                        >
                                            <div className="position-relative" style={{ height: '160px', overflow: 'hidden' }}>
                                                {category.image ? (
                                                    <img
                                                        src={resolveImage(category.image) || 'https://via.placeholder.com/500x320?text=Category'}
                                                        alt={category.nom}
                                                        className="w-100 h-100 object-fit-cover"
                                                        style={{ transition: 'transform 0.5s ease' }}
                                                        onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
                                                        onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
                                                    />
                                                ) : (
                                                    <div className="w-100 h-100 bg-soft-primary d-flex align-items-center justify-content-center">
                                                        <Package size={48} className="text-primary opacity-50" />
                                                    </div>
                                                )}
                                                <div className="position-absolute bottom-0 start-0 w-100 p-3" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.8), transparent)' }}>
                                                    <h5 className="text-white mb-0 fw-bold">{category.nom}</h5>
                                                </div>
                                            </div>
                                            <div className="p-3 d-flex justify-content-between align-items-center">
                                                <p className="text-muted text-sm mb-0 text-truncate me-2" style={{ fontSize: '0.85rem' }}>
                                                    {category.description || 'Explore products in this category'}
                                                </p>
                                                <div className="bg-soft-primary rounded-circle p-1 text-primary">
                                                    <ChevronRight size={16} />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Matching Products section */}
                    {filteredProducts.length > 0 && (
                        <div>
                            <h5 className="fw-semibold text-muted mb-3 pb-2 border-bottom">
                                Matching Products
                                <span className="ms-2 badge bg-soft-primary text-primary" style={{ fontSize: '0.75rem' }}>
                                    {filteredProducts.length}
                                </span>
                            </h5>
                            <div className="row g-4">
                                {filteredProducts.map(p => (
                                    <div key={p.id} className="col-md-4 col-lg-3">
                                        <SoftCard className="h-100 d-flex flex-column p-0 overflow-hidden">
                                            <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                                                {p.image ? (
                                                    <img
                                                        src={resolveImage(p.image) || 'https://via.placeholder.com/400x300?text=Product'}
                                                        alt={p.nom}
                                                        className="w-100 h-100 object-fit-cover"
                                                    />
                                                ) : (
                                                    <div className="w-100 h-100 bg-light d-flex align-items-center justify-content-center text-muted">
                                                        No Image
                                                    </div>
                                                )}
                                                <div className="position-absolute top-0 end-0 p-2">
                                                    <SoftBadge variant={p.stockDisponible > 0 ? 'success' : 'danger'}>
                                                        {p.stockDisponible > 0 ? 'In Stock' : 'Out of Stock'}
                                                    </SoftBadge>
                                                </div>
                                            </div>
                                            <div className="p-3 d-flex flex-column flex-grow-1">
                                                <div className="mb-1 d-flex justify-content-between align-items-start">
                                                    <h6 className="fw-bold mb-0 flex-grow-1 pe-2">{p.nom}</h6>
                                                    <span className="fw-bold text-nowrap" style={{ color: 'var(--soft-text)', fontSize: '1.1rem' }}>{p.prixUnitaire} DH</span>
                                                </div>
                                                {p.categorieNom && (
                                                    <small className="text-primary fw-semibold mb-2 d-inline-block">{p.categorieNom}</small>
                                                )}
                                                <p className="text-muted small flex-grow-1">{p.description}</p>
                                                {p.fournisseurNom && (
                                                    <Link
                                                        to={`/client/suppliers/${p.fournisseurId}`}
                                                        className="text-muted mb-3 d-inline-flex align-items-center text-decoration-none small"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <i className="bi bi-shop me-1"></i>{p.fournisseurNom}
                                                    </Link>
                                                )}
                                                <SoftButton
                                                    variant="outline"
                                                    className="w-100 mt-auto"
                                                    disabled={p.stockDisponible <= 0}
                                                    onClick={() => openModal(p)}
                                                >
                                                    Add to Cart
                                                </SoftButton>
                                            </div>
                                        </SoftCard>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </>
            )}

            {/* Add to Cart modal */}
            <SoftModal
                isOpen={selectedProduct !== null}
                onClose={() => setSelectedProduct(null)}
                title="Add to Cart"
            >
                {selectedProduct && (
                    <form onSubmit={handleAddToCart}>
                        <div className="d-flex align-items-center mb-4">
                            <div
                                className="bg-light rounded me-3 overflow-hidden d-flex align-items-center justify-content-center"
                                style={{ width: '64px', height: '64px' }}
                            >
                                {selectedProduct.image ? (
                                    <img src={resolveImage(selectedProduct.image) || ''} alt={selectedProduct.nom} className="w-100 h-100 object-fit-cover" />
                                ) : (
                                    <span className="text-muted small">Img</span>
                                )}
                            </div>
                            <div>
                                <h6 className="fw-bold mb-1">{selectedProduct.nom}</h6>
                                <div className="text-primary fw-bold">{selectedProduct.prixUnitaire} DH</div>
                            </div>
                        </div>
                        <div className="mb-4">
                            <SoftInput
                                label="Quantity"
                                type="number"
                                min={selectedProduct.quantiteMinimumCommande || 1}
                                max={selectedProduct.stockDisponible}
                                required
                                value={quantity}
                                onChange={(e) => setQuantity(parseInt(e.target.value) || 1)}
                            />
                            <div className="d-flex align-items-center mt-2 text-warning small">
                                <AlertCircle size={14} className="me-1" />
                                <span>Minimum order quantity is {selectedProduct.quantiteMinimumCommande || 1}</span>
                            </div>
                        </div>
                        <div className="d-flex justify-content-end gap-2">
                            <SoftButton variant="outline" type="button" onClick={() => setSelectedProduct(null)}>
                                Cancel
                            </SoftButton>
                            <SoftButton
                                type="submit"
                                isLoading={isSubmitting}
                                disabled={quantity < (selectedProduct.quantiteMinimumCommande || 1) || quantity > selectedProduct.stockDisponible}
                            >
                                Confirm
                            </SoftButton>
                        </div>
                    </form>
                )}
            </SoftModal>
        </div>
    );
};
