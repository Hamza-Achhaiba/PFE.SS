import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { favorisApi } from '../../../api/favoris.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { Truck, Heart, UserX } from 'lucide-react';
import { User } from '../../../api/types';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';

const resolveImage = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8088';
    return `${backendUrl}${url}`;
};

export const FavoritesPage: React.FC = () => {
    const [favorites, setFavorites] = useState<User[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [supplierToRemove, setSupplierToRemove] = useState<User | null>(null);

    useEffect(() => {
        loadFavorites();
    }, []);

    const loadFavorites = async () => {
        setIsLoading(true);
        try {
            const data = await favorisApi.getFavorites();
            setFavorites(data);
        } catch (error) {
            console.error('Failed to load favorites', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleRemoveFavorite = async () => {
        if (!supplierToRemove?.id) return;
        try {
            await favorisApi.removeFavorite(supplierToRemove.id);
            setFavorites(prev => prev.filter(f => f.id !== supplierToRemove.id));
        } catch (error) {
            console.error('Failed to remove favorite', error);
        } finally {
            setSupplierToRemove(null);
        }
    };

    return (
        <div className="container-fluid p-0">
            <div className="d-flex align-items-center gap-3 mb-4">
                <div className="soft-badge primary rounded-circle p-2">
                    <Heart size={24} fill="white" color="white" />
                </div>
                <h4 className="fw-bold mb-0">My Favorite Suppliers</h4>
            </div>

            {isLoading ? <SoftLoader /> : (
                <div className="row g-4">
                    {favorites?.map((fournisseur) => (
                        <div className="col-md-6 col-lg-4" key={fournisseur.id}>
                            <SoftCard className="h-100 d-flex flex-column align-items-center text-center p-4 position-relative">
                                <button
                                    onClick={() => setSupplierToRemove(fournisseur)}
                                    className="btn btn-link position-absolute top-0 end-0 m-2 text-danger p-2 hover-scale"
                                    title="Remove from favorites"
                                >
                                    <Heart size={20} fill="currentColor" />
                                </button>

                                <div
                                    className="rounded-circle p-1 mb-3"
                                    style={{
                                        width: 84,
                                        height: 84,
                                        background: 'linear-gradient(180deg, rgba(255,255,255,0.28), rgba(255,255,255,0.08)), var(--soft-bg, #f8fafc)',
                                        border: '1px solid rgba(148,163,184,0.28)',
                                        boxShadow: '0 8px 20px rgba(15,23,42,0.10)',
                                    }}
                                >
                                    <div
                                        className="rounded-circle w-100 h-100 d-flex align-items-center justify-content-center overflow-hidden"
                                        style={{ background: 'var(--soft-bg, #f1f5f9)' }}
                                    >
                                        {fournisseur.image ? (
                                            <img src={resolveImage(fournisseur.image)} alt={fournisseur.nomEntreprise || fournisseur.nom} className="w-100 h-100 object-fit-cover" />
                                        ) : (
                                            <div className="soft-badge info rounded-circle p-3">
                                                <Truck size={32} color="white" />
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <Link 
                                    to={`/client/suppliers/${fournisseur.id}`}
                                    className="text-decoration-none text-body"
                                >
                                    <h5 className="fw-bold mb-1 hover-primary">{fournisseur.nomEntreprise || fournisseur.nom}</h5>
                                </Link>
                                <p className="text-muted small mb-3">{fournisseur.adresse}</p>

                                <div className="mt-auto w-100 text-start bg-body-tertiary p-3 rounded" style={{ background: 'var(--soft-bg)' }}>
                                    <div className="small text-muted mb-1">Contact: {fournisseur.nom}</div>
                                    <div className="small text-muted mb-1">Email: {fournisseur.email}</div>
                                    <div className="small text-muted">Phone: {fournisseur.telephone}</div>
                                </div>
                            </SoftCard>
                        </div>
                    ))}
                    {(!favorites || favorites.length === 0) && (
                        <div className="col-12 py-5">
                            <SoftCard className="text-center p-5 bg-light border-dashed">
                                <div className="text-muted mb-3">
                                    <UserX size={48} strokeWidth={1} className="mb-3 opacity-50" />
                                    <h5>Aucun fournisseur favori</h5>
                                    <p className="mb-0">Ajoutez des fournisseurs à vos favoris depuis l'annuaire pour les retrouver ici.</p>
                                </div>
                                <a href="/client/suppliers" className="soft-btn soft-btn-primary px-4">
                                    Voir l'annuaire
                                </a>
                            </SoftCard>
                        </div>
                    )}
                </div>
            )}

            <ConfirmDialog
                isOpen={!!supplierToRemove}
                onClose={() => setSupplierToRemove(null)}
                onConfirm={handleRemoveFavorite}
                title="Confirm Removal"
                message="Are you sure you want to remove this supplier from your favorites? This action cannot be undone."
                entityName={supplierToRemove?.nomEntreprise || supplierToRemove?.nom}
                confirmLabel="Remove"
            />
        </div>
    );
};
