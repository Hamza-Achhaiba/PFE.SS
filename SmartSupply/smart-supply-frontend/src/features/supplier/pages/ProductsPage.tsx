import { useState, useEffect } from 'react';
import { productsApi } from '../../../api/products.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftTable } from '../../../components/ui/SoftTable';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { SoftModal } from '../../../components/ui/SoftModal';
import { SoftInput } from '../../../components/ui/SoftInput';
import { AlertTriangle } from 'lucide-react';
import { toast } from 'react-toastify';

export const ProductsPage: React.FC = () => {
  const [produits, setProduits] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditStockModalOpen, setIsEditStockModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newStock, setNewStock] = useState<number>(0);
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
    Promise.all([
      productsApi.mesProduits(),
      productsApi.suggestionsReapprovisionnement().catch(() => []) // fail gracefully
    ])
      .then(([prods, suggs]) => {
        setProduits(prods);
        setSuggestions(suggs);
      })
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

  const handleToggleStatus = async (id: number) => {
    setIsLoading(true);
    try {
      await productsApi.toggleStatut(id);
      toast.success('Product status updated!');
      fetchProduits(); // Re-fetch products to get updated list
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update product status.');
      setIsLoading(false);
    }
  };

  const openEditStockModal = (product: any) => {
    setEditingProduct(product);
    setNewStock(product.stockDisponible);
    setIsEditStockModalOpen(true);
  };

  const handleEditStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setIsSubmitting(true);
    try {
      await productsApi.updateStock(editingProduct.id, newStock);
      toast.success('Stock updated successfully!');
      setIsEditStockModalOpen(false);
      fetchProduits();
    } catch (err: any) {
      console.error(err);
      toast.error('Failed to update stock.');
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

      {suggestions && suggestions.length > 0 && (
        <SoftCard className="mb-4 border-warning bg-warning bg-opacity-10 border-2">
          <div className="d-flex align-items-center mb-3">
            <AlertTriangle className="text-warning me-2" size={24} />
            <h5 className="fw-bold mb-0 text-warning">Restock Suggestions</h5>
          </div>
          <p className="text-muted small mb-3">The following products are running low on stock based on their alert thresholds. Please restock them.</p>
          <div className="d-flex flex-wrap gap-2">
            {suggestions.map(s => (
              <SoftBadge key={s.id} variant="warning" className="px-3 py-2">
                {s.nom} ({s.stockDisponible} left)
              </SoftBadge>
            ))}
          </div>
        </SoftCard>
      )}

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
                <div style={{ cursor: 'pointer' }} onClick={() => handleToggleStatus(p.id)}>
                  <SoftBadge variant={p.actif ? 'success' : 'danger'}>
                    {p.actif ? 'Active' : 'Disabled'}
                  </SoftBadge>
                </div>
              </td>
              <td>
                <SoftButton variant="outline" style={{ padding: '0.2rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openEditStockModal(p)}>Edit Stock</SoftButton>
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

      <SoftModal
        isOpen={isEditStockModalOpen}
        onClose={() => setIsEditStockModalOpen(false)}
        title="Edit Product Stock"
      >
        <form onSubmit={handleEditStockSubmit}>
          <div className="mb-4">
            <p className="text-muted small mb-2">Editing stock for: <strong className="text-dark">{editingProduct?.nom}</strong></p>
            <SoftInput
              label="New Available Stock"
              type="number"
              min="0"
              required
              value={newStock}
              onChange={e => setNewStock(parseInt(e.target.value) || 0)}
            />
          </div>
          <div className="d-flex justify-content-end gap-2">
            <SoftButton variant="outline" type="button" onClick={() => setIsEditStockModalOpen(false)}>
              Cancel
            </SoftButton>
            <SoftButton type="submit" isLoading={isSubmitting}>
              Save Changes
            </SoftButton>
          </div>
        </form>
      </SoftModal>
    </div>
  );
};
