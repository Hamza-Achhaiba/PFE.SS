import React, { useState, useEffect } from 'react';
import { cartApi } from '../../../api/cart.api';
import { ordersApi } from '../../../api/orders.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftTable } from '../../../components/ui/SoftTable';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { toast } from 'react-toastify';
import { PanierResponse } from '../../../api/types';
import { ShoppingCart, Trash2, Minus, Plus } from 'lucide-react';
import { SoftEmptyState } from '../../../components/ui/SoftEmptyState';
import { useNavigate } from 'react-router-dom';

export const CartPage: React.FC = () => {
  const [panier, setPanier] = useState<PanierResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isValidating, setIsValidating] = useState(false);
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

  const handleValider = async () => {
    setIsValidating(true);
    try {
      await ordersApi.validerPanier();
      toast.success('Order placed successfully!');
      fetchPanier();
      navigate('/client/orders');
    } catch (e) {
      toast.error('Failed to validate order. Check stock.');
    } finally {
      setIsValidating(false);
    }
  };

  const handleUpdateQuantity = async (produitId: number, currentQty: number, change: number) => {
    const newQty = currentQty + change;
    if (newQty <= 0) {
      handleRemoveItem(produitId);
      return;
    }

    try {
      const updatedPanier = await cartApi.modifierQuantite({ produitId, quantite: newQty });
      setPanier(updatedPanier);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update quantity');
    }
  };

  const handleRemoveItem = async (produitId: number) => {
    try {
      const updatedPanier = await cartApi.supprimerItem(produitId);
      setPanier(updatedPanier);
      toast.success('Item removed from cart');
    } catch (error) {
      toast.error('Failed to remove item');
    }
  };

  const handleClearCart = async () => {
    if (!window.confirm('Are you sure you want to clear your entire cart?')) return;
    try {
      const updatedPanier = await cartApi.viderPanier();
      setPanier(updatedPanier);
      toast.success('Cart cleared successfully');
    } catch (error) {
      toast.error('Failed to clear cart');
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
          <SoftButton className="text-danger border-0 bg-transparent shadow-none" onClick={handleClearCart}>
            <Trash2 size={16} className="me-2" />
            Clear Cart
          </SoftButton>
        )}
      </div>

      <div className="row g-4">
        <div className="col-lg-8">
          <SoftCard className="p-0 border-0 shadow-none bg-transparent">
            <SoftTable headers={['Product', 'Price', 'Quantity', 'Total', 'Actions']}>
              {items.map((item) => (
                <tr key={item.id}>
                  <td>
                    <div className="d-flex align-items-center">
                      <div
                        className="bg-light rounded me-3 d-flex align-items-center justify-content-center"
                        style={{ width: '48px', height: '48px', objectFit: 'cover' }}
                      >
                        {item.image ? (
                          <img src={item.image} alt={item.nomProduit} className="w-100 h-100 rounded" style={{ objectFit: 'cover' }} />
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
                        onClick={() => handleUpdateQuantity(item.produitId, item.quantite, -1)}
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
                      onClick={() => handleRemoveItem(item.produitId)}
                      title="Remove item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </SoftTable>
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
              isLoading={isValidating}
              onClick={handleValider}
            >
              Checkout & Place Order
            </SoftButton>
          </SoftCard>
        </div>
      </div>
    </div>
  );
};
