import React, { useState, useEffect } from 'react';
import { productsApi } from '../../../api/products.api';
import { cartApi } from '../../../api/cart.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { SoftInput } from '../../../components/ui/SoftInput';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { toast } from 'react-toastify';

export const SearchPage: React.FC = () => {
  const [motCle, setMotCle] = useState('');
  const [enStock, setEnStock] = useState(false);
  const [produits, setProduits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [addingId, setAddingId] = useState<number | null>(null);

  const fetchProducts = () => {
    setIsLoading(true);
    productsApi.recherche({ motCle, enStock })
      .then(setProduits)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchProducts();
  };

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

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-4">Search Products</h4>

      <SoftCard className="mb-4">
        <form onSubmit={handleSearch} className="d-flex align-items-center gap-3 flex-wrap">
          <div style={{ flex: '1', minWidth: '250px' }}>
            <SoftInput
              placeholder="Search by keywords..."
              value={motCle}
              onChange={e => setMotCle(e.target.value)}
              className="soft-search-input"
            />
          </div>
          <div className="d-flex align-items-center gap-2">
            <input
              type="checkbox"
              id="enStockCheck"
              checked={enStock}
              onChange={e => setEnStock(e.target.checked)}
              className="cursor-pointer"
            />
            <label htmlFor="enStockCheck" className="cursor-pointer soft-label">In Stock Only</label>
          </div>
          <SoftButton type="submit">Search</SoftButton>
        </form>
      </SoftCard>

      {isLoading ? <SoftLoader /> : (
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
                <p className="text-muted small mb-2">Supplier: {p.fournisseurNom || 'Unknown'}</p>

                <SoftButton
                  variant="outline"
                  className="w-100"
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
              No results found for your search.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
