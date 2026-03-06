import React, { useState, useEffect } from 'react';
import { cartApi } from '../../../api/cart.api';
import { ordersApi } from '../../../api/orders.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftTable } from '../../../components/ui/SoftTable';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { toast } from 'react-toastify';
import { ShoppingCart } from 'lucide-react';
import { SoftEmptyState } from '../../../components/ui/SoftEmptyState';
import { useNavigate } from 'react-router-dom';

export const CartPage: React.FC = () => {
  const [panier, setPanier] = useState<any[]>([]);
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
      navigate('/client/orders');
    } catch (e) {
      toast.error('Failed to validate order. Check stock.');
    } finally {
      setIsValidating(false);
    }
  };

  if (isLoading) return <SoftLoader />;

  const rsData: any = panier;
  const items: any[] = Array.isArray(rsData)
    ? rsData
    : (rsData?.items || rsData?.lignesCommande || rsData?.details || []);

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

  const total = items.reduce((acc, item) => acc + (item.quantite * (item.produit?.prixUnitaire || 0)), 0);

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-4">Shopping Cart</h4>

      <div className="row g-4">
        <div className="col-lg-8">
          <SoftCard className="p-0 border-0 shadow-none bg-transparent">
            <SoftTable headers={['Product', 'Supplier', 'Quantity', 'Unit Price', 'Total']}>
              {items.map((item, idx) => (
                <tr key={idx}>
                  <td className="fw-semibold">{item.produit?.nom || 'Unknown'}</td>
                  <td className="text-muted">{item.produit?.fournisseurNom || '-'}</td>
                  <td>{item.quantite}</td>
                  <td>{item.produit?.prixUnitaire || 0} DH</td>
                  <td className="fw-bold">{(item.quantite * (item.produit?.prixUnitaire || 0)).toFixed(2)} DH</td>
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
