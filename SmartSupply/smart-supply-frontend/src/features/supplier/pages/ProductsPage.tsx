import { useState, useEffect } from 'react';
import { productsApi } from '../../../api/products.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftTable } from '../../../components/ui/SoftTable';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { SoftModal } from '../../../components/ui/SoftModal';
import { SoftInput } from '../../../components/ui/SoftInput';
import { toast } from 'react-toastify';

export const ProductsPage: React.FC = () => {
  const [produits, setProduits] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [newProduct, setNewProduct] = useState({
    nom: '',
    description: '',
    categorie: '',
    prixUnitaire: 0,
    stockDisponible: 0,
    alerteStock: false,
    actif: true
  });

  const fetchProduits = () => {
    setIsLoading(true);
    productsApi.mesProduits()
      .then(setProduits)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.nom || newProduct.prixUnitaire <= 0) {
      toast.error('Please fill in required fields correctly.');
      return;
    }

    setIsSubmitting(true);
    try {
      await productsApi.create(newProduct);
      toast.success('Product added successfully!');
      setIsAddModalOpen(false);
      setNewProduct({
        nom: '', description: '', categorie: '', prixUnitaire: 0, stockDisponible: 0, alerteStock: false, actif: true
      });
      fetchProduits();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <SoftLoader />;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold">My Products</h4>
        <SoftButton onClick={() => setIsAddModalOpen(true)}>+ Add Product</SoftButton>
      </div>

      <SoftCard className="p-0 border-0 shadow-none bg-transparent">
        <SoftTable headers={['Name', 'Category', 'Price', 'Stock', 'Status', 'Actions']}>
          {produits?.map(p => (
            <tr key={p.id}>
              <td className="fw-semibold">{p.nom}</td>
              <td className="text-muted">{p.categorie || '-'}</td>
              <td>{p.prixUnitaire} DH</td>
              <td>
                <span className={p.alerteStock ? 'text-danger fw-bold' : ''}>
                  {p.stockDisponible}
                </span>
              </td>
              <td>
                <SoftBadge variant={p.actif ? 'success' : 'danger'}>
                  {p.actif ? 'Active' : 'Disabled'}
                </SoftBadge>
              </td>
              <td>
                <SoftButton variant="outline" style={{ padding: '0.2rem 0.8rem', fontSize: '0.8rem' }}>Edit Stock</SoftButton>
              </td>
            </tr>
          ))}
          {(!produits || produits.length === 0) && (
            <tr>
              <td colSpan={6} className="text-center p-4">No products found.</td>
            </tr>
          )}
        </SoftTable>
      </SoftCard>

      <SoftModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        title="Add New Product"
      >
        <form onSubmit={handleAddProduct}>
          <SoftInput
            label="Product Name"
            placeholder="E.g., Laptop Stand"
            required
            value={newProduct.nom}
            onChange={e => setNewProduct({ ...newProduct, nom: e.target.value })}
          />
          <SoftInput
            label="Category"
            placeholder="E.g., Electronics"
            value={newProduct.categorie}
            onChange={e => setNewProduct({ ...newProduct, categorie: e.target.value })}
          />
          <div className="mb-3">
            <label className="soft-label d-block mb-1">Description</label>
            <textarea
              className="soft-input"
              rows={3}
              placeholder="Product description..."
              value={newProduct.description}
              onChange={e => setNewProduct({ ...newProduct, description: e.target.value })}
            />
          </div>
          <div className="row">
            <div className="col-6">
              <SoftInput
                label="Unit Price (DH)"
                type="number"
                step="0.01"
                min="0"
                required
                value={newProduct.prixUnitaire}
                onChange={e => setNewProduct({ ...newProduct, prixUnitaire: parseFloat(e.target.value) || 0 })}
              />
            </div>
            <div className="col-6">
              <SoftInput
                label="Initial Stock"
                type="number"
                min="0"
                required
                value={newProduct.stockDisponible}
                onChange={e => setNewProduct({ ...newProduct, stockDisponible: parseInt(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <SoftButton variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </SoftButton>
            <SoftButton type="submit" isLoading={isSubmitting}>
              Add Product
            </SoftButton>
          </div>
        </form>
      </SoftModal>
    </div>
  );
};
