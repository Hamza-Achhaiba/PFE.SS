import React, { useState, useEffect } from 'react';
import { cartApi } from '../../../api/cart.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftTable } from '../../../components/ui/SoftTable';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { toast } from 'react-toastify';
import { PanierResponse } from '../../../api/types';
import { ShoppingCart, Trash2, Minus, Plus } from 'lucide-react';
import { SoftEmptyState } from '../../../components/ui/SoftEmptyState';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { useNavigate } from 'react-router-dom';

const resolveImage = (url: string) => {
  if (!url) return null;
  if (url.startsWith('http')) return url;
  const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8087';
  return `${backendUrl}${url}`;
};

export const CartPage: React.FC = () => {
  const [panier, setPanier] = useState<PanierResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [itemToRemove, setItemToRemove] = useState<{ produitId: number; nom: string } | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const navigate = useNavigate();

  const fetchPanier = () => {
    setIsLoading(true);
    cartApi.getPanier()
      .then(setPanier)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchPanier();
  }, []);

  const handleValider = () => {
    navigate('/client/checkout');
  };

  const handleUpdateQuantity = async (produitId: number, currentQty: number, change: number, nomProduit?: string) => {
    const newQty = currentQty + change;
    if (newQty <= 0) {
      setItemToRemove({ produitId, nom: nomProduit || 'Unknown' });
      return;
    }

    try {
      const updatedPanier = await cartApi.modifierQuantite({ produitId, quantite: newQty });
      setPanier(updatedPanier);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async () => {
    if (!itemToRemove) return;
    try {
      const updatedPanier = await cartApi.supprimerItem(itemToRemove.produitId);
      setPanier(updatedPanier);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    } finally {
      setItemToRemove(null);
    }
  };

  const handleClearCart = async () => {
    try {
      const updatedPanier = await cartApi.viderPanier();
      setPanier(updatedPanier);
      toast.success('Cart cleared successfully');
    } catch (error) {
      toast.error('Failed to clear cart');
    } finally {
      setShowClearConfirm(false);
    }
  };

  if (isLoading) return <SoftLoader />;

  const items = panier?.lignes || [];

  if (!items || items.length === 0) {
    return (
      <SoftCard className="h-100">
        <SoftEmptyState
          icon={<ShoppingCart size={48} />}
          title="Your Cart is Empty"
          description="Browse the catalog to add items to your cart."
        />
      </SoftCard>
    );
  }

  const total = panier?.montantTotal || 0;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold mb-0">Shopping Cart</h4>
        {items.length > 0 && (
          <SoftButton className="text-danger border-0 bg-transparent shadow-none" onClick={() => setShowClearConfirm(true)}>
            <Trash2 size={16} className="me-2" />
            Clear Cart
          </SoftButton>
        )}
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <SoftCard className="p-0 border-0 shadow-none bg-transparent">
            <div className="table-responsive">
              <SoftTable headers={['Product', 'Price', 'Quantity', 'Total', 'Actions']}>
                {items.map((item) => (
                  <tr key={item.id}>
                    <td>
                      <div className="d-flex align-items-center">
                        <div
                          className="bg-body-tertiary rounded me-3 d-flex align-items-center justify-content-center"
                          style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                        >
                          {item.image ? (
                            <img src={resolveImage(item.image) || ''} alt={item.nomProduit} className="w-100 h-100 rounded" style={{ objectFit: 'cover' }} />
                          ) : (
                            <ShoppingCart className="text-secondary opacity-50" />
                          )}
                        </div>
                        <span className="fw-semibold">{item.nomProduit || 'Unknown'}</span>
                      </div>
                    </td>
                    <td>{item.prixUnitaire || 0} DH</td>
                    <td>
                      <div className="d-flex align-items-center gap-2">
                        <button
                          className="btn btn-sm btn-light border p-1"
                          onClick={() => {
                            const minQ = item.quantiteMinimumCommande || 1;
                            const newQty = item.quantite - 1;
                            if (newQty > 0 && newQty < minQ) {
                              toast.warning(`Minimum order quantity is ${minQ}`);
                              return;
                            }
                            handleUpdateQuantity(item.produitId, item.quantite, -1, item.nomProduit);
                          }}
                        >
                          <Minus size={14} />
                        </button>
                        <span className="fw-semibold mx-2" style={{ minWidth: '20px', textAlign: 'center' }}>
                          {item.quantite}
                        </span>
                        <button
                          className="btn btn-sm btn-light border p-1"
                          onClick={() => handleUpdateQuantity(item.produitId, item.quantite, 1)}
                        >
                          <Plus size={14} />
                        </button>
                      </div>
                    </td>
                    <td className="fw-bold">{item.sousTotal?.toFixed(2) || (item.quantite * (item.prixUnitaire || 0)).toFixed(2)} DH</td>
                    <td>
                      <button
                        className="btn btn-sm text-danger p-1"
                        onClick={() => setItemToRemove({ produitId: item.produitId, nom: item.nomProduit || 'Unknown' })}
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </SoftTable>
            </div>
          </SoftCard>
        </div>

        <div className="col-lg-4">
          <SoftCard title="Order Summary">
            <div className="d-flex justify-content-between mb-3 text-muted">
              <span>Subtotal</span>
              <span>{total.toFixed(2)} DH</span>
            </div>
            <div className="d-flex justify-content-between mb-3 text-muted">
              <span>Delivery</span>
              <span>0.00 DH</span>
            </div>
            <hr />
            <div className="d-flex justify-content-between mb-4 mt-2">
              <span className="fw-bold fs-5">Total</span>
              <span className="fw-bold fs-5" style={{ color: 'var(--soft-primary)' }}>{total.toFixed(2)} DH</span>
            </div>

            <SoftButton
              className="w-100 py-3"
              onClick={handleValider}
            >
              Checkout & Place Order
            </SoftButton>
          </SoftCard>
        </div>
      </div>

      <ConfirmDialog
        isOpen={!!itemToRemove}
        onClose={() => setItemToRemove(null)}
        onConfirm={handleRemoveItem}
        title="Confirm Removal"
        message="Are you sure you want to remove this item from your cart? This action cannot be undone."
        entityName={itemToRemove?.nom}
        confirmLabel="Remove"
      />

      <ConfirmDialog
        isOpen={showClearConfirm}
        onClose={() => setShowClearConfirm(false)}
        onConfirm={handleClearCart}
        title="Confirm Removal"
        message="Are you sure you want to clear your entire cart? This action cannot be undone."
        confirmLabel="Remove"
      />
    </div>
  );
};
