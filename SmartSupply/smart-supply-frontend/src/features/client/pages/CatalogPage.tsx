import React, { useState, useEffect } from 'react';
import { productsApi } from '../../../api/products.api';
import { cartApi } from '../../../api/cart.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { toast } from 'react-toastify';

export const CatalogPage: React.FC = () => {
  const [produits, setProduits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);

  useEffect(() => {
    productsApi.getProduits()
      .then(setProduits)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const handleAdd = async (id: number) => {
    setAddingId(id);
    try {
      await cartApi.ajouter({ produitId: id, quantite: 1 });
      toast.success('Added to cart');
    } catch (e) {
      toast.error('Failed to add to cart');
    } finally {
      setAddingId(null);
    }
  };

  if (isLoading) return <SoftLoader />;

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-4">Product Catalog</h4>
      <div className="row g-4">
        {produits?.map(p => (
          <div className="col-md-4 col-lg-3" key={p.id}>
            <SoftCard className="h-100 d-flex flex-column">
              <div className="mb-2 d-flex justify-content-between">
                <SoftBadge variant={p.stockDisponible > 0 ? 'success' : 'danger'}>
                  {p.stockDisponible > 0 ? 'In Stock' : 'Out of Stock'}
                </SoftBadge>
                <span className="fw-bold" style={{ color: 'var(--soft-text)' }}>{p.prixUnitaire} DH</span>
              </div>
              <h6 className="fw-bold mb-1">{p.nom}</h6>
              <p className="text-muted small flex-grow-1">{p.description}</p>

              <SoftButton
                variant="outline"
                className="w-100 mt-3"
                disabled={p.stockDisponible <= 0 || addingId === p.id}
                onClick={() => p.id && handleAdd(p.id)}
              >
                Add to Cart
              </SoftButton>
            </SoftCard>
          </div>
        ))}
        {(!produits || produits.length === 0) && (
          <div className="col-12 text-center text-muted p-5">
            No products available.
          </div>
        )}
      </div>
    </div>
  );
};
