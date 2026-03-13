import { useState, useEffect } from 'react';
import { productsApi } from '../../../api/products.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftTable } from '../../../components/ui/SoftTable';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { SoftModal } from '../../../components/ui/SoftModal';
import { SoftInput } from '../../../components/ui/SoftInput';
import { AlertTriangle, ChevronDown, Trash2 } from 'lucide-react';
import { toast } from 'react-toastify';
import { CategoryService } from '../../categories/category.service';
import { Category } from '../../categories/category.types';

export const ProductsPage: React.FC = () => {
  const [produits, setProduits] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditStockModalOpen, setIsEditStockModalOpen] = useState(false);
  const [isEditProductModalOpen, setIsEditProductModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedProductAction, setSelectedProductAction] = useState<any>(null);

  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [newStock, setNewStock] = useState<number>(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);

  const [imageFile, setImageFile] = useState<File | null>(null);

  const [newProduct, setNewProduct] = useState({
    nom: '',
    description: '',
    categorieId: '' as number | '',
    prixUnitaire: 0,
    stockDisponible: 0,
    quantiteMinimumCommande: 1,
    alerteStock: false,
    actif: true
  });

  const fetchProduits = () => {
    setIsLoading(true);
    Promise.all([
      productsApi.mesProduits(),
      productsApi.suggestionsReapprovisionnement().catch(() => []), // fail gracefully
      CategoryService.getAllCategories().catch(() => [])
    ])
      .then(([prods, suggs, cats]) => {
        setProduits(prods);
        setSuggestions(suggs);
        setCategories(cats);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  };

  useEffect(() => {
    fetchProduits();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.nom || newProduct.prixUnitaire <= 0 || newProduct.categorieId === '') {
      toast.error('Please fill in required fields correctly, including selecting a category.');
      return;
    }

    setIsSubmitting(true);
    try {
      let imageUrl = '';
      if (imageFile) {
        imageUrl = await productsApi.uploadImage(imageFile);
      }

      await productsApi.create({
        ...newProduct,
        categorieId: newProduct.categorieId as number,
        image: imageUrl || undefined
      });

      toast.success('Product added successfully!');
      setIsAddModalOpen(false);
      setNewProduct({
        nom: '', description: '', categorieId: '', prixUnitaire: 0, stockDisponible: 0, quantiteMinimumCommande: 1, alerteStock: false, actif: true
      });
      setImageFile(null);
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

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductAction) return;

    setIsSubmitting(true);
    try {
      let imageUrl = selectedProductAction.image;
      if (imageFile) {
        imageUrl = await productsApi.uploadImage(imageFile);
      }

      await productsApi.update(selectedProductAction.id, {
        ...selectedProductAction,
        categorieId: selectedProductAction.categorieId as number,
        image: imageUrl || undefined
      });

      toast.success('Product updated successfully!');
      setIsEditProductModalOpen(false);
      setImageFile(null);
      fetchProduits();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProductAction) return;
    setIsSubmitting(true);
    try {
      await productsApi.delete(selectedProductAction.id);
      toast.success("Product deleted successfully!");
      setIsDeleteModalOpen(false);
      fetchProduits();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete product.");
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
        <div className="table-responsive">
          <SoftTable headers={['Name', 'Category', 'Price', 'Stock', 'Status', 'Actions']}>
            {produits?.map(p => (
              <tr
                key={p.id}
                className="cursor-pointer hover-bg-light"
                onClick={() => { setSelectedProductAction({ ...p }); setIsEditProductModalOpen(true); }}
                style={{ cursor: 'pointer' }}
              >
                <td className="fw-semibold">
                  <div className="d-flex align-items-center">
                    <div
                      className="bg-light rounded me-3 overflow-hidden d-flex align-items-center justify-content-center"
                      style={{ width: '40px', height: '40px', flexShrink: 0 }}
                    >
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
                        <span className="text-muted small">Img</span>
                      )}
                    </div>
                    {p.nom}
                  </div>
                </td>
                <td className="text-muted">{p.categorieNom || '-'}</td>
                <td>{p.prixUnitaire} DH</td>
                <td>
                  <span className={p.alerteStock ? 'text-danger fw-bold' : ''}>
                    {p.stockDisponible}
                  </span>
                </td>
                <td>
                  <div style={{ cursor: 'pointer' }} onClick={(e) => { e.stopPropagation(); handleToggleStatus(p.id); }}>
                    <SoftBadge variant={p.actif ? 'success' : 'danger'}>
                      {p.actif ? 'Active' : 'Disabled'}
                    </SoftBadge>
                  </div>
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="d-flex align-items-center gap-2">
                    <SoftButton variant="outline" style={{ padding: '0.2rem 0.8rem', fontSize: '0.8rem' }} onClick={() => openEditStockModal(p)}>Edit Stock</SoftButton>
                    <button className="btn btn-sm btn-outline-danger p-1" onClick={() => { setSelectedProductAction(p); setIsDeleteModalOpen(true); }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(!produits || produits.length === 0) && (
              <tr>
                <td colSpan={6} className="text-center p-4">No products found.</td>
              </tr>
            )}
          </SoftTable>
        </div>
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
          <div className="mb-3">
            <label className="soft-label d-block mb-1">Category <span className="text-danger">*</span></label>
            <div className="position-relative">
              <select
                className="soft-input w-100 appearance-none bg-transparent pe-5"
                required
                value={newProduct.categorieId}
                onChange={e => setNewProduct({ ...newProduct, categorieId: parseInt(e.target.value) || '' })}
                style={{ cursor: 'pointer' }}
              >
                <option value="" disabled>Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nom}</option>
                ))}
              </select>
              <div className="position-absolute top-50 end-0 translate-middle-y pe-3 pointer-events-none text-muted">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
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
          <div className="mb-3">
            <label className="soft-label d-block mb-1">Product Image</label>
            <input
              type="file"
              accept="image/*"
              className="soft-input w-100"
              onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)}
            />
            {imageFile && (
              <small className="text-muted d-block mt-1">Selected: {imageFile.name}</small>
            )}
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
          <div className="row mt-3">
            <div className="col-12">
              <SoftInput
                label="Minimum Order Quantity"
                type="number"
                min="1"
                required
                value={newProduct.quantiteMinimumCommande}
                onChange={e => setNewProduct({ ...newProduct, quantiteMinimumCommande: parseInt(e.target.value) || 1 })}
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
            <p className="text-muted small mb-2">Editing stock for: <strong className="text-body">{editingProduct?.nom}</strong></p>
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

      <SoftModal
        isOpen={isEditProductModalOpen}
        onClose={() => { setIsEditProductModalOpen(false); setImageFile(null); }}
        title="Edit Product"
      >
        <form onSubmit={handleEditProductSubmit}>
          <SoftInput
            label="Product Name"
            placeholder="E.g., Laptop Stand"
            required
            value={selectedProductAction?.nom || ''}
            onChange={e => setSelectedProductAction({ ...selectedProductAction, nom: e.target.value })}
          />
          <div className="mb-3">
            <label className="soft-label d-block mb-1">Category <span className="text-danger">*</span></label>
            <div className="position-relative">
              <select
                className="soft-input w-100 appearance-none bg-transparent pe-5"
                required
                value={selectedProductAction?.categorieId || ''}
                onChange={e => setSelectedProductAction({ ...selectedProductAction, categorieId: parseInt(e.target.value) || '' })}
                style={{ cursor: 'pointer' }}
              >
                <option value="" disabled>Select a category...</option>
                {categories.map(cat => (
                  <option key={cat.id} value={cat.id}>{cat.nom}</option>
                ))}
              </select>
              <div className="position-absolute top-50 end-0 translate-middle-y pe-3 pointer-events-none text-muted">
                <ChevronDown size={18} />
              </div>
            </div>
          </div>
          <div className="mb-3">
            <label className="soft-label d-block mb-1">Description</label>
            <textarea
              className="soft-input"
              rows={3}
              placeholder="Product description..."
              value={selectedProductAction?.description || ''}
              onChange={e => setSelectedProductAction({ ...selectedProductAction, description: e.target.value })}
            />
          </div>
          <div className="mb-3">
            <label className="soft-label d-block mb-1">Product Image</label>
            <input
              type="file"
              accept="image/*"
              className="soft-input w-100"
              onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)}
            />
            {imageFile ? (
              <small className="text-muted d-block mt-1">Replacing with: {imageFile.name}</small>
            ) : selectedProductAction?.image ? (
              <small className="text-muted d-block mt-1">Current image will be kept if no new file is selected.</small>
            ) : null}
          </div>
          <div className="row">
            <div className="col-12">
              <SoftInput
                label="Unit Price (DH)"
                type="number"
                step="0.01"
                min="0"
                required
                value={selectedProductAction?.prixUnitaire || 0}
                onChange={e => setSelectedProductAction({ ...selectedProductAction, prixUnitaire: parseFloat(e.target.value) || 0 })}
              />
            </div>
          </div>
          <div className="row mt-3">
            <div className="col-12">
              <SoftInput
                label="Minimum Order Quantity"
                type="number"
                min="1"
                required
                value={selectedProductAction?.quantiteMinimumCommande || 1}
                onChange={e => setSelectedProductAction({ ...selectedProductAction, quantiteMinimumCommande: parseInt(e.target.value) || 1 })}
              />
            </div>
          </div>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <SoftButton variant="outline" type="button" onClick={() => { setIsEditProductModalOpen(false); setImageFile(null); }}>
              Cancel
            </SoftButton>
            <SoftButton type="submit" isLoading={isSubmitting}>
              Save Changes
            </SoftButton>
          </div>
        </form>
      </SoftModal>

      <SoftModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Product"
      >
        <div className="py-3">
          <p>Are you sure you want to delete <strong>{selectedProductAction?.nom}</strong>? This action cannot be undone.</p>
          <div className="d-flex justify-content-end gap-2 mt-4">
            <SoftButton variant="outline" onClick={() => setIsDeleteModalOpen(false)}>
              Cancel
            </SoftButton>
            <SoftButton onClick={handleDeleteProduct} isLoading={isSubmitting} style={{ backgroundColor: '#dc3545', color: 'white', border: 'none' }}>
              Confirm Delete
            </SoftButton>
          </div>
        </div>
      </SoftModal>

    </div>
  );
};
