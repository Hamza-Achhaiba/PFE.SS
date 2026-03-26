import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    Check,
    ChevronDown,
    MoreHorizontal,
    Trash2,
    X,
    Search,
    Package
} from 'lucide-react';
import { toast } from 'react-toastify';
import { adminApi } from '../../../api/admin.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftModal } from '../../../components/ui/SoftModal';

type ProductApprovalStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

interface AdminProduct {
    id: number;
    nom: string;
    prix: number;
    description?: string;
    image?: string;
    nomFournisseur?: string;
    fournisseurId?: number;
    categorieId?: number;
    categorieNom?: string;
    quantiteDisponible: number;
    quantiteMinimumCommande: number;
    alerteStock: boolean;
    actif: boolean;
    statutApprobation: ProductApprovalStatus;
}

interface ProductAction {
    label: string;
    status?: ProductApprovalStatus;
    intent: 'success' | 'warning' | 'danger';
    icon: React.ReactNode;
}

const menuSurfaceStyle: React.CSSProperties = {
    minWidth: '11rem',
    padding: '0.5rem',
    borderRadius: '1.25rem',
    border: '1px solid var(--soft-border)',
    background: 'var(--soft-secondary)',
    boxShadow: 'var(--soft-shadow-hover)',
    backdropFilter: 'blur(20px)',
    zIndex: 100
};

const menuItemStyles: Record<ProductAction['intent'], React.CSSProperties> = {
    success: { color: '#10b981', backgroundColor: 'transparent' },
    warning: { color: '#f59e0b', backgroundColor: 'transparent' },
    danger: { color: '#ef4444', backgroundColor: 'transparent' }
};

const getProductActions = (status: ProductApprovalStatus): ProductAction[] => {
    const actions: ProductAction[] = [];

    if (status !== 'APPROVED') {
        actions.push({ label: 'Approve', status: 'APPROVED', intent: 'success', icon: <Check size={15} /> });
    }
    if (status !== 'REJECTED') {
        actions.push({ label: 'Reject', status: 'REJECTED', intent: 'warning', icon: <X size={15} /> });
    }
    actions.push({ label: 'Remove', intent: 'danger', icon: <Trash2 size={15} /> });

    return actions;
};

export const AdminProductsPage: React.FC = () => {
    const [products, setProducts] = useState<AdminProduct[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeMenuId, setActiveMenuId] = useState<number | null>(null);
    const [hoveredAction, setHoveredAction] = useState<string | null>(null);
    const [productToDelete, setProductToDelete] = useState<AdminProduct | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<ProductApprovalStatus | 'ALL'>('ALL');
    const menuContainerRef = useRef<HTMLDivElement | null>(null);

    const loadProducts = () => {
        setLoading(true);
        adminApi.getProducts()
            .then(setProducts)
            .catch((error) => {
                console.error(error);
                toast.error('Failed to load products');
            })
            .finally(() => setLoading(false));
    };

    useEffect(() => {
        loadProducts();
    }, []);

    useEffect(() => {
        if (activeMenuId === null) return;
        const handleOutsideClick = (event: MouseEvent) => {
            if (menuContainerRef.current && !menuContainerRef.current.contains(event.target as Node)) {
                setActiveMenuId(null);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [activeMenuId]);

    const handleStatusUpdate = async (id: number, status: ProductApprovalStatus) => {
        try {
            const updated = await adminApi.updateProductStatus(id, status);
            toast.success(`Product ${status.toLowerCase()} successfully`);
            setProducts((prev) => prev.map((p) => p.id === id ? { ...p, statutApprobation: updated.statutApprobation ?? status } : p));
            setActiveMenuId(null);
        } catch (error) {
            console.error('Failed to update product status', error);
            toast.error('Failed to update product status');
        }
    };

    const handleDeleteProduct = async () => {
        if (!productToDelete) return;
        setIsDeleting(true);
        try {
            await adminApi.deleteProduct(productToDelete.id);
            setProducts((prev) => prev.filter((p) => p.id !== productToDelete.id));
            toast.success('Product removed successfully');
            setProductToDelete(null);
            setActiveMenuId(null);
        } catch (error: any) {
            console.error('Failed to delete product', error);
            toast.error(error?.response?.data?.message || 'Failed to remove product');
        } finally {
            setIsDeleting(false);
        }
    };

    const statusStyles = useMemo(() => ({
        APPROVED: { bg: 'rgba(16, 185, 129, 0.12)', color: '#10b981' },
        PENDING: { bg: 'rgba(245, 158, 11, 0.12)', color: '#f59e0b' },
        REJECTED: { bg: 'rgba(239, 68, 68, 0.12)', color: '#ef4444' }
    }), []);

    const filteredProducts = useMemo(() => {
        return products.filter((p) => {
            const matchesSearch = searchTerm === '' ||
                p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (p.nomFournisseur && p.nomFournisseur.toLowerCase().includes(searchTerm.toLowerCase())) ||
                (p.categorieNom && p.categorieNom.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesStatus = statusFilter === 'ALL' || p.statutApprobation === statusFilter;
            return matchesSearch && matchesStatus;
        });
    }, [products, searchTerm, statusFilter]);

    const statusCounts = useMemo(() => {
        const counts = { ALL: products.length, PENDING: 0, APPROVED: 0, REJECTED: 0 };
        products.forEach(p => { counts[p.statutApprobation]++; });
        return counts;
    }, [products]);

    const resolveImage = (url: string) => {
        if (!url) return null;
        if (url.startsWith('http')) return url;
        const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8088';
        return `${backendUrl}${url}`;
    };

    const fallbackImg = (e: React.SyntheticEvent<HTMLImageElement>) => {
        (e.target as HTMLImageElement).src = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="%23999" stroke-width="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><path d="m21 15-5-5L5 21"/></svg>';
    };

    return (
        <div className="container-fluid p-0">
            <div className="mb-4">
                <h4 className="fw-bold mb-1">Manage Products</h4>
                <p className="text-muted mb-0">Review product listings and manage approval status</p>
            </div>

            {/* Filter bar */}
            <div className="d-flex flex-wrap gap-2 mb-3 align-items-center">
                <div className="position-relative flex-grow-1" style={{ maxWidth: '320px' }}>
                    <Search size={16} className="position-absolute text-muted" style={{ left: '12px', top: '50%', transform: 'translateY(-50%)' }} />
                    <input
                        type="text"
                        className="form-control rounded-pill ps-5"
                        placeholder="Search products…"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{
                            background: 'var(--soft-glass-bg)',
                            border: '1px solid var(--soft-border)',
                            fontSize: '0.85rem'
                        }}
                    />
                </div>
                {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((s) => (
                    <button
                        key={s}
                        className={`btn btn-sm rounded-pill px-3 fw-medium ${statusFilter === s ? 'active' : ''}`}
                        onClick={() => setStatusFilter(s)}
                        style={{
                            background: statusFilter === s
                                ? (s === 'ALL' ? 'var(--soft-primary)' : statusStyles[s === 'ALL' ? 'APPROVED' : s].bg)
                                : 'var(--soft-glass-bg)',
                            color: statusFilter === s
                                ? (s === 'ALL' ? '#fff' : statusStyles[s === 'ALL' ? 'APPROVED' : s].color)
                                : 'var(--soft-text)',
                            border: `1px solid ${statusFilter === s ? 'transparent' : 'var(--soft-border)'}`,
                            fontSize: '0.78rem',
                            transition: 'all 0.2s ease'
                        }}
                    >
                        {s === 'ALL' ? 'All' : s.charAt(0) + s.slice(1).toLowerCase()} ({statusCounts[s]})
                    </button>
                ))}
            </div>

            <SoftCard>
                <div className="table-responsive">
                    <table className="table table-hover align-middle mb-0 font-sm">
                        <thead>
                            <tr>
                                <th className="text-muted fw-semibold border-0" style={{ width: '56px' }}></th>
                                <th className="text-muted fw-semibold border-0">Product</th>
                                <th className="text-muted fw-semibold border-0">Supplier</th>
                                <th className="text-muted fw-semibold border-0 text-center">Category</th>
                                <th className="text-muted fw-semibold border-0 text-end">Price</th>
                                <th className="text-muted fw-semibold border-0 text-center">Stock</th>
                                <th className="text-muted fw-semibold border-0 text-center">Status</th>
                                <th className="text-muted fw-semibold border-0 text-end">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredProducts.map((product) => {
                                const actions = getProductActions(product.statutApprobation);
                                const menuOpen = activeMenuId === product.id;

                                return (
                                    <tr key={product.id}>
                                        {/* Image */}
                                        <td style={{ width: '56px' }}>
                                            <div
                                                className="rounded-3 overflow-hidden d-flex align-items-center justify-content-center flex-shrink-0"
                                                style={{
                                                    width: '44px',
                                                    height: '44px',
                                                    background: 'var(--soft-bg)',
                                                    border: '1px solid var(--soft-border)'
                                                }}
                                            >
                                                {product.image ? (
                                                    <img
                                                        src={resolveImage(product.image) || ''}
                                                        alt={product.nom}
                                                        onError={fallbackImg}
                                                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    />
                                                ) : (
                                                    <Package size={20} className="text-muted" />
                                                )}
                                            </div>
                                        </td>
                                        {/* Product name */}
                                        <td>
                                            <div className="fw-bold text-body text-wrap" style={{ maxWidth: '200px', wordBreak: 'break-word' }}>
                                                {product.nom}
                                            </div>
                                        </td>
                                        {/* Supplier */}
                                        <td>
                                            <span className="text-muted" style={{ fontSize: '0.82rem' }}>
                                                {product.nomFournisseur || '—'}
                                            </span>
                                        </td>
                                        {/* Category */}
                                        <td className="text-center">
                                            {product.categorieNom ? (
                                                <span
                                                    className="badge bg-white text-dark border px-2 py-1 rounded-pill fw-normal"
                                                    style={{ fontSize: '0.72rem' }}
                                                >
                                                    {product.categorieNom}
                                                </span>
                                            ) : (
                                                <span className="text-muted" style={{ fontSize: '0.78rem' }}>—</span>
                                            )}
                                        </td>
                                        {/* Price */}
                                        <td className="text-end fw-semibold" style={{ fontSize: '0.85rem' }}>
                                            {product.prix?.toFixed(2)} MAD
                                        </td>
                                        {/* Stock */}
                                        <td className="text-center">
                                            <span
                                                style={{
                                                    fontSize: '0.82rem',
                                                    color: product.alerteStock ? '#ef4444' : 'var(--soft-text)',
                                                    fontWeight: product.alerteStock ? 600 : 400
                                                }}
                                            >
                                                {product.quantiteDisponible}
                                            </span>
                                        </td>
                                        {/* Status */}
                                        <td className="text-center">
                                            <div
                                                className="px-3 py-1 rounded-pill d-inline-block fw-medium"
                                                style={{
                                                    backgroundColor: statusStyles[product.statutApprobation]?.bg ?? 'rgba(100,100,100,0.1)',
                                                    color: statusStyles[product.statutApprobation]?.color ?? '#666',
                                                    fontSize: '0.75rem'
                                                }}
                                            >
                                                {product.statutApprobation}
                                            </div>
                                        </td>
                                        {/* Actions */}
                                        <td className="text-end">
                                            <div
                                                ref={menuOpen ? menuContainerRef : null}
                                                className="position-relative d-inline-block"
                                            >
                                                <button
                                                    type="button"
                                                    className="btn btn-sm border-0 rounded-pill d-inline-flex align-items-center gap-2"
                                                    onClick={() => setActiveMenuId((prev) => prev === product.id ? null : product.id)}
                                                    aria-expanded={menuOpen}
                                                    style={{
                                                        padding: '0.45rem 0.9rem',
                                                        background: 'var(--soft-glass-bg)',
                                                        color: 'var(--soft-text)',
                                                        border: '1px solid var(--soft-border)',
                                                        transition: 'all 0.2s ease-in-out',
                                                        boxShadow: menuOpen ? 'var(--soft-shadow-hover)' : 'none'
                                                    }}
                                                >
                                                    <MoreHorizontal size={16} />
                                                    <span className="fw-medium">Actions</span>
                                                    <ChevronDown
                                                        size={14}
                                                        style={{
                                                            opacity: 0.7,
                                                            transform: menuOpen ? 'rotate(180deg)' : 'none',
                                                            transition: 'transform 0.2s'
                                                        }}
                                                    />
                                                </button>

                                                {menuOpen && (
                                                    <div className="position-absolute end-0 mt-2" style={{ zIndex: 30 }}>
                                                        <div style={menuSurfaceStyle}>
                                                            {actions.map((action) => {
                                                                const hoverKey = `${product.id}-${action.label}`;
                                                                const isHovered = hoveredAction === hoverKey;
                                                                const baseStyle = menuItemStyles[action.intent];

                                                                return (
                                                                    <button
                                                                        key={action.label}
                                                                        type="button"
                                                                        className="w-100 border-0 d-flex align-items-center justify-content-between"
                                                                        onMouseEnter={() => setHoveredAction(hoverKey)}
                                                                        onMouseLeave={() => setHoveredAction(null)}
                                                                        onClick={() => {
                                                                            if (action.label === 'Remove') {
                                                                                setProductToDelete(product);
                                                                            } else if (action.status) {
                                                                                handleStatusUpdate(product.id, action.status);
                                                                            }
                                                                        }}
                                                                        style={{
                                                                            ...baseStyle,
                                                                            padding: '0.7rem 0.8rem',
                                                                            borderRadius: '0.85rem',
                                                                            transition: 'all 0.18s ease',
                                                                            backgroundColor: isHovered
                                                                                ? action.intent === 'danger'
                                                                                    ? 'rgba(239, 68, 68, 0.12)'
                                                                                    : 'var(--soft-glass-hover)'
                                                                                : 'transparent',
                                                                            transform: isHovered ? 'translateX(4px)' : 'translateX(0)'
                                                                        }}
                                                                    >
                                                                        <span className="d-inline-flex align-items-center gap-2 fw-medium">
                                                                            {action.icon}
                                                                            {action.label}
                                                                        </span>
                                                                    </button>
                                                                );
                                                            })}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {loading && (
                                <tr>
                                    <td colSpan={8} className="text-center py-4">
                                        <div className="spinner-border spinner-border-sm text-primary"></div>
                                    </td>
                                </tr>
                            )}
                            {!loading && filteredProducts.length === 0 && (
                                <tr>
                                    <td colSpan={8} className="text-center text-muted py-4">No products found.</td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </SoftCard>

            {/* Delete confirmation modal */}
            <SoftModal
                isOpen={!!productToDelete}
                onClose={() => { if (!isDeleting) setProductToDelete(null); }}
                title="Remove Product"
            >
                <div className="py-2">
                    <p className="text-body mb-2">
                        Are you sure you want to remove this product? This action cannot be undone.
                    </p>
                    <p className="text-muted small mb-0">
                        {productToDelete?.nom}
                    </p>
                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <button
                            type="button"
                            className="btn btn-sm px-3 rounded-pill fw-medium"
                            onClick={() => setProductToDelete(null)}
                            disabled={isDeleting}
                            style={{
                                border: '1px solid rgba(15, 23, 42, 0.08)',
                                background: 'rgba(148, 163, 184, 0.10)',
                                color: 'var(--soft-text, #0f172a)'
                            }}
                        >
                            Cancel
                        </button>
                        <button
                            type="button"
                            className="btn btn-sm px-3 rounded-pill fw-medium border-0"
                            onClick={handleDeleteProduct}
                            disabled={isDeleting}
                            style={{
                                background: 'rgba(220, 53, 69, 0.14)',
                                color: '#dc3545'
                            }}
                        >
                            {isDeleting ? 'Removing...' : 'Remove Product'}
                        </button>
                    </div>
                </div>
            </SoftModal>
        </div>
    );
};
