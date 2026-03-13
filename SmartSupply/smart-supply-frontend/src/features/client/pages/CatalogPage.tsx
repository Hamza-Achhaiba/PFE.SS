import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { productsApi } from '../../../api/products.api';
import { cartApi } from '../../../api/cart.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftModal } from '../../../components/ui/SoftModal';
import { SoftInput } from '../../../components/ui/SoftInput';
import { AlertCircle } from 'lucide-react';
import { toast } from 'react-toastify';

export const CatalogPage: React.FC = () => {
  const [produits, setProduits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProduct, setSelectedProduct] = useState<any | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [searchParams] = useSearchParams();
  const categoryFilter = searchParams.get('category');

  useEffect(() => {
    productsApi.getProduits()
      .then(setProduits)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const openModal = (product: any) => {
    setSelectedProduct(product);
    setQuantity(product.quantiteMinimumCommande || 1);
  };

  const handleAddToCartConfirm = async (e: React.FormEvent) => {
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

  if (isLoading) return <SoftLoader />;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">
          {categoryFilter ? `Catalog: ${categoryFilter}` : 'Product Catalog'}
        </h4>
      </div>
      <div className="row g-4">
        {produits?.filter(p => !categoryFilter || p.categorieNom === categoryFilter).map(p => (
          <div className="col-md-4 col-lg-3" key={p.id}>
            <SoftCard className="h-100 d-flex flex-column p-0 overflow-hidden">
              <div style={{ height: '180px', overflow: 'hidden', position: 'relative' }}>
                {p.image ? (
                  <img
                    src={p.image}
                    alt={p.nom}
                    className="w-100 h-100 object-fit-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=500&q=80';
                    }}
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
                  <small className="text-muted mb-3 d-block"><i className="bi bi-shop me-1"></i>{p.fournisseurNom}</small>
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
        {(!produits || produits.length === 0) && (
          <div className="col-12 text-center text-muted p-5">
            No products available.
          </div>
        )}
      </div>

      <SoftModal
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        title="Add to Cart"
      >
        {selectedProduct && (
          <form onSubmit={handleAddToCartConfirm}>
            <div className="d-flex align-items-center mb-4">
              <div
                className="bg-light rounded me-3 overflow-hidden d-flex align-items-center justify-content-center"
                style={{ width: '64px', height: '64px' }}
              >
                {selectedProduct.image ? (
                  <img src={selectedProduct.image} alt={selectedProduct.nom} className="w-100 h-100 object-fit-cover" />
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
                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
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
