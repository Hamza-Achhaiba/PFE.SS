import React, { useEffect, useState } from 'react';
import { Category } from '../../categories/category.types';
import { CategoryService } from '../../categories/category.service';
import { Package, Search, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const Categories: React.FC = () => {
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    useEffect(() => {
        loadData();
    }, []);

    const loadData = async () => {
        try {
            setLoading(true);
            const cats = await CategoryService.getAllCategories();
            setCategories(cats);
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
        ? categories.filter(c => normalize(c.nom ?? '').includes(term))
        : categories;

    const handleCategoryClick = (categoryName: string) => {
        navigate(`/client/catalog?category=${encodeURIComponent(categoryName)}`);
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
                        placeholder="Search categories..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
            </div>

            {/* No results */}
            {filteredCategories.length === 0 && isSearchActive && (
                <div className="text-center py-5">
                    <div className="d-inline-flex bg-soft-primary p-3 rounded-circle mb-3">
                        <Package size={32} className="text-primary" />
                    </div>
                    <h5>No categories found</h5>
                    <p className="text-muted">Try a different search term.</p>
                </div>
            )}

            {/* Category grid */}
            {filteredCategories.length > 0 && (
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
            )}
        </div>
    );
};
