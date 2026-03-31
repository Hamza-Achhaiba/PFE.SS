import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '../../../api/search.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftInput } from '../../../components/ui/SoftInput';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { Truck, Heart, Star, User, Mail } from 'lucide-react';
import { favorisApi } from '../../../api/favoris.api';
import { resolveImage } from '../../../utils/imageUtils';

export const SuppliersPage: React.FC = () => {
  const [entreprise, setEntreprise] = useState('');

  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<number[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFavorites();
  }, []);

  const loadFavorites = async () => {
    try {
      const favs = await favorisApi.getFavorites();
      setFavorites(favs.map((f: any) => f.id));
    } catch (error) {
      console.error('Failed to load favorites', error);
    }
  };

  useEffect(() => {
    setIsLoading(true);
    searchApi.getFournisseurs(entreprise)
      .then(setFournisseurs)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [entreprise]);

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-4">Suppliers Directory</h4>

      <SoftCard 
        className="mb-4 border shadow-sm" 
        style={{ backgroundColor: 'var(--soft-secondary)', borderColor: 'var(--soft-border)', borderRadius: '24px' }}
      >
        <div style={{ maxWidth: '400px' }}>
          <SoftInput
            placeholder="Search by company name..."
            value={entreprise}
            onChange={e => setEntreprise(e.target.value)}
            className="soft-search-input border-0"
            style={{ backgroundColor: 'var(--soft-bg)', color: 'var(--soft-text)' }}
          />
        </div>
      </SoftCard>

      {isLoading ? <SoftLoader /> : (
        <div className="row g-4">
          {fournisseurs?.map((fournisseur) => {
            const isFavorite = favorites.includes(fournisseur.id);
            
            const toggleFavorite = async () => {
              try {
                if (isFavorite) {
                  await favorisApi.removeFavorite(fournisseur.id);
                  setFavorites(prev => prev.filter(id => id !== fournisseur.id));
                } else {
                  await favorisApi.addFavorite(fournisseur.id);
                  setFavorites(prev => [...prev, fournisseur.id]);
                }
              } catch (error) {
                console.error('Failed to toggle favorite', error);
              }
            };

            return (
              <div className="col-md-6 col-lg-4" key={fournisseur.id}>
                <SoftCard 
                  className="h-100 p-0 overflow-hidden border shadow-sm position-relative transition-all hover-translate-y" 
                  style={{ borderRadius: '24px', backgroundColor: 'var(--soft-secondary)', borderColor: 'var(--soft-border)' }}
                >
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite();
                    }}
                    className="btn btn-link position-absolute top-0 end-0 m-3 p-2 rounded-circle shadow-lg z-1 border hover-scale"
                    style={{ 
                      backgroundColor: 'var(--soft-bg)', 
                      borderColor: 'var(--soft-border)',
                      color: isFavorite ? '#f43f5e' : 'var(--soft-text-muted)', 
                      width: '40px', 
                      height: '40px' 
                    }}
                    title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
                  >
                    <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>

                  <Link 
                    to={`/client/suppliers/${fournisseur.id}`}
                    className="text-decoration-none text-body"
                  >
                    <div className="p-4 d-flex flex-column align-items-center text-center">
                      <div 
                        className="p-1 rounded-circle mb-3 shadow-md border" 
                        style={{ width: '80px', height: '80px', backgroundColor: 'var(--soft-bg)', borderColor: 'var(--soft-border)' }}
                      >
                        <div 
                          className="w-100 h-100 rounded-circle d-flex align-items-center justify-content-center overflow-hidden"
                          style={{ backgroundColor: 'var(--soft-secondary)' }}
                        >
                          {fournisseur.image ? (
                            <img src={resolveImage(fournisseur.image)} alt={fournisseur.nomEntreprise} className="w-100 h-100 object-fit-cover" />
                          ) : (
                            <Truck size={32} className="text-primary opacity-75" />
                          )}
                        </div>
                      </div>

                      <h5 className="fw-bold mb-1" style={{ color: 'var(--soft-text)' }}>{fournisseur.nomEntreprise || fournisseur.nom}</h5>
                      
                      <div className="d-flex align-items-center gap-1 mb-2">
                        <Star size={14} className="text-warning" fill="#f6c23e" />
                        <span className="small fw-bold" style={{ color: 'var(--soft-text)' }}>4.8</span>
                        <span className="small" style={{ color: 'var(--soft-text-muted)' }}>(12 reviews)</span>
                      </div>

                      <p className="small mb-3 text-truncate w-100 px-2" style={{ color: 'var(--soft-text-muted)' }}>{fournisseur.adresse}</p>

                      <div className="w-100 mt-2 p-3 rounded-4 border text-start" style={{ backgroundColor: 'var(--soft-bg)', borderColor: 'var(--soft-border)' }}>
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <div 
                            className="p-1 rounded-circle shadow-sm border" 
                            style={{ backgroundColor: 'var(--soft-secondary)', borderColor: 'var(--soft-border)' }}
                          ><User size={12} className="text-muted" /></div>
                          <span className="small text-truncate" style={{ color: 'var(--soft-text-muted)' }}>{fournisseur.nom}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <div 
                            className="p-1 rounded-circle shadow-sm border" 
                            style={{ backgroundColor: 'var(--soft-secondary)', borderColor: 'var(--soft-border)' }}
                          ><Mail size={12} className="text-muted" /></div>
                          <span className="small text-truncate" style={{ color: 'var(--soft-text-muted)' }}>{fournisseur.email}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </SoftCard>
              </div>
            );
          })}
          {( !fournisseurs || fournisseurs.length === 0) && (
            <div className="col-12 text-center p-5 opacity-50">
              <Truck size={48} className="text-muted mb-3 opacity-20" />
              <p className="text-muted" style={{ color: 'var(--soft-text-muted)' }}>No suppliers found.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
