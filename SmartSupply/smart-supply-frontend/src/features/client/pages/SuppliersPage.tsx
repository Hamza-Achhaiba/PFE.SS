import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { searchApi } from '../../../api/search.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftInput } from '../../../components/ui/SoftInput';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { Truck, Heart, Star, User, Mail } from 'lucide-react';
import { favorisApi } from '../../../api/favoris.api';

export const SuppliersPage: React.FC = () => {
  const [entreprise, setEntreprise] = useState('');

  const resolveImage = (url: string | undefined) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8088';
    return `${backendUrl}${url}`;
  };

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

      <SoftCard className="mb-4">
        <div style={{ maxWidth: '400px' }}>
          <SoftInput
            placeholder="Search by company name..."
            value={entreprise}
            onChange={e => setEntreprise(e.target.value)}
            className="soft-search-input"
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
                <SoftCard className="h-100 p-0 overflow-hidden border-0 shadow-sm position-relative transition-all hover-translate-y" style={{ borderRadius: '24px' }}>
                  <button
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      toggleFavorite();
                    }}
                    className="btn btn-link position-absolute top-0 end-0 m-3 p-2 bg-white rounded-circle shadow-sm z-1"
                    style={{ color: isFavorite ? '#e91e63' : '#adb5bd', width: '40px', height: '40px' }}
                    title={isFavorite ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                  >
                    <Heart size={20} fill={isFavorite ? 'currentColor' : 'none'} />
                  </button>

                  <Link 
                    to={`/client/suppliers/${fournisseur.id}`}
                    className="text-decoration-none text-body"
                  >
                    <div className="p-4 d-flex flex-column align-items-center text-center">
                      <div 
                        className="bg-light p-1 rounded-circle mb-3 shadow-sm" 
                        style={{ width: '80px', height: '80px' }}
                      >
                        <div className="w-100 h-100 rounded-circle bg-white d-flex align-items-center justify-content-center overflow-hidden">
                          {fournisseur.image ? (
                            <img src={resolveImage(fournisseur.image)} alt={fournisseur.nomEntreprise} className="w-100 h-100 object-fit-cover" />
                          ) : (
                            <Truck size={32} className="text-primary" />
                          )}
                        </div>
                      </div>

                      <h5 className="fw-bold mb-1">{fournisseur.nomEntreprise || fournisseur.nom}</h5>
                      
                      <div className="d-flex align-items-center gap-1 mb-2">
                        <Star size={14} className="text-warning fill-warning" />
                        <span className="small fw-bold">4.8</span>
                        <span className="text-muted small">(12 reviews)</span>
                      </div>

                      <p className="text-muted small mb-3 text-truncate w-100 px-2">{fournisseur.adresse}</p>

                      <div className="w-100 mt-2 p-3 bg-light rounded-4 text-start">
                        <div className="d-flex align-items-center gap-2 mb-2">
                          <div className="bg-white p-1 rounded-circle"><User size={12} className="text-muted" /></div>
                          <span className="small text-muted text-truncate">{fournisseur.nom}</span>
                        </div>
                        <div className="d-flex align-items-center gap-2">
                          <div className="bg-white p-1 rounded-circle"><Mail size={12} className="text-muted" /></div>
                          <span className="small text-muted text-truncate">{fournisseur.email}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </SoftCard>
              </div>
            );
          })}
          {(!fournisseurs || fournisseurs.length === 0) && (
            <div className="col-12 text-center text-muted p-5">
              No suppliers found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
