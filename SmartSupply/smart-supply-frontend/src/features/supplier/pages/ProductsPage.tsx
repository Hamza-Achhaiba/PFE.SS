import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { AlertTriangle, ChevronDown, Trash2, X } from 'lucide-react';
import { toast } from 'react-toastify';
import { productsApi } from '../../../api/products.api';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftInput } from '../../../components/ui/SoftInput';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftModal } from '../../../components/ui/SoftModal';
import { ConfirmDialog } from '../../../components/ui/ConfirmDialog';
import { SoftTable } from '../../../components/ui/SoftTable';
import { CategoryService } from '../../categories/category.service';
import { Category } from '../../categories/category.types';
import { useSupplierStatus } from '../hooks/useSupplierStatus';



export const ProductsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const outOfStockFilter = searchParams.get('filter') === 'out-of-stock';

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

  const { canManageProducts: supplierCanManageProducts, restrictionMessage: supplierRestrictionMessage } = useSupplierStatus();

  const preventRestrictedAction = () => {
    toast.warning(supplierRestrictionMessage);
  };

  const fetchProduits = () => {
    setIsLoading(true);
    Promise.all([
      productsApi.mesProduits(),
      productsApi.suggestionsReapprovisionnement().catch(() => []),
      CategoryService.getAllCategories().catch(() => []),
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

  const resolveImage = (url: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8088';
    return `${backendUrl}${url}`;
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplierCanManageProducts) {
      preventRestrictedAction();
      return;
    }
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
        nom: '',
        description: '',
        categorieId: '',
        prixUnitaire: 0,
        stockDisponible: 0,
        quantiteMinimumCommande: 1,
        alerteStock: false,
        actif: true
      });
      setImageFile(null);
      fetchProduits();
    } catch (error: any) {
      toast.error(error.response?.data?.message || error.message || 'Failed to add product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (id: number) => {
    if (!supplierCanManageProducts) {
      preventRestrictedAction();
      return;
    }
    setIsLoading(true);
    try {
      await productsApi.toggleStatut(id);
      toast.success('Product status updated!');
      fetchProduits();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update product status.');
      setIsLoading(false);
    }
  };

  const openEditStockModal = (product: any) => {
    if (!supplierCanManageProducts) {
      preventRestrictedAction();
      return;
    }
    setEditingProduct(product);
    setNewStock(product.stockDisponible);
    setIsEditStockModalOpen(true);
  };

  const handleEditStockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!supplierCanManageProducts) {
      preventRestrictedAction();
      return;
    }
    setIsSubmitting(true);
    try {
      await productsApi.updateStock(editingProduct.id, newStock);
      toast.success('Stock updated successfully!');
      setIsEditStockModalOpen(false);
      fetchProduits();
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message || 'Failed to update stock.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEditProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductAction) return;
    if (!supplierCanManageProducts) {
      preventRestrictedAction();
      return;
    }

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
      toast.error(error.response?.data?.message || error.message || 'Failed to update product');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteProduct = async () => {
    if (!selectedProductAction) return;
    if (!supplierCanManageProducts) {
      preventRestrictedAction();
      return;
    }
    setIsSubmitting(true);
    try {
      await productsApi.delete(selectedProductAction.id);
      toast.success('Product deleted successfully!');
      setIsDeleteModalOpen(false);
      fetchProduits();
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.message || 'Failed to delete product.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) return <SoftLoader />;

  return (
    <div className="container-fluid p-0">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h4 className="fw-bold">My Products</h4>
        <SoftButton
          disabled={!supplierCanManageProducts}
          onClick={() => (supplierCanManageProducts ? setIsAddModalOpen(true) : preventRestrictedAction())}
          title={!supplierCanManageProducts ? supplierRestrictionMessage : undefined}
        >
          + Add Product
        </SoftButton>
      </div>



      {outOfStockFilter && (
        <div className="d-flex align-items-center gap-2 mb-3 px-3 py-2 rounded-3" style={{ background: 'rgba(var(--bs-danger-rgb), 0.08)', border: '1px solid rgba(var(--bs-danger-rgb), 0.25)' }}>
          <AlertTriangle size={16} className="text-danger flex-shrink-0" />
          <span className="text-danger fw-semibold" style={{ fontSize: '0.875rem' }}>Showing out-of-stock products only</span>
          <button
            className="btn btn-sm ms-auto p-0 border-0 bg-transparent text-danger"
            onClick={() => setSearchParams({})}
            title="Clear filter"
          >
            <X size={16} />
          </button>
        </div>
      )}

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
            {(outOfStockFilter ? produits.filter(p => p.stockDisponible === 0) : produits)?.map(p => (
              <tr
                key={p.id}
                className={supplierCanManageProducts ? 'cursor-pointer hover-bg-light' : ''}
                onClick={() => {
                  if (!supplierCanManageProducts) return;
                  setSelectedProductAction({ ...p });
                  setIsEditProductModalOpen(true);
                }}
                style={{ cursor: supplierCanManageProducts ? 'pointer' : 'default' }}
              >
                <td className="fw-semibold">
                  <div className="d-flex align-items-center">
                    <div
                      className="bg-light rounded me-3 overflow-hidden d-flex align-items-center justify-content-center"
                      style={{ width: '40px', height: '40px', flexShrink: 0 }}
                    >
                      {p.image ? (
                        <img
                          src={resolveImage(p.image) || 'https://via.placeholder.com/40x40?text=P'}
                          alt={p.nom}
                          className="w-100 h-100 object-fit-cover"
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
                  <div
                    style={{ cursor: supplierCanManageProducts ? 'pointer' : 'not-allowed', opacity: supplierCanManageProducts ? 1 : 0.6 }}
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!supplierCanManageProducts) {
                        preventRestrictedAction();
                        return;
                      }
                      handleToggleStatus(p.id);
                    }}
                  >
                    <SoftBadge variant={p.actif ? 'success' : 'danger'}>
                      {p.actif ? 'Active' : 'Disabled'}
                    </SoftBadge>
                  </div>
                </td>
                <td onClick={e => e.stopPropagation()}>
                  <div className="d-flex align-items-center gap-2">
                    <SoftButton
                      variant="outline"
                      style={{ padding: '0.2rem 0.8rem', fontSize: '0.8rem' }}
                      onClick={() => openEditStockModal(p)}
                      disabled={!supplierCanManageProducts}
                      title={!supplierCanManageProducts ? supplierRestrictionMessage : undefined}
                    >
                      Edit Stock
                    </SoftButton>
                    <button
                      className="btn btn-sm btn-outline-danger p-1"
                      disabled={!supplierCanManageProducts}
                      title={!supplierCanManageProducts ? supplierRestrictionMessage : undefined}
                      onClick={() => {
                        if (!supplierCanManageProducts) {
                          preventRestrictedAction();
                          return;
                        }
                        setSelectedProductAction(p);
                        setIsDeleteModalOpen(true);
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {(outOfStockFilter ? produits.filter(p => p.stockDisponible === 0) : produits).length === 0 && (
              <tr>
                <td colSpan={6} className="text-center p-4">
                  {outOfStockFilter ? 'No out-of-stock products found.' : 'No products found.'}
                </td>
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
                disabled={!supplierCanManageProducts}
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
              disabled={!supplierCanManageProducts}
            />
          </div>
          <div className="mb-3">
            <label className="soft-label d-block mb-1">Product Image</label>
            <input
              type="file"
              accept="image/*"
              className="soft-input w-100"
              onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)}
              disabled={!supplierCanManageProducts}
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
                disabled={!supplierCanManageProducts}
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
                disabled={!supplierCanManageProducts}
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
                disabled={!supplierCanManageProducts}
              />
            </div>
          </div>
          {!supplierCanManageProducts && (
            <p className="text-warning small mt-3 mb-0">{supplierRestrictionMessage}</p>
          )}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <SoftButton variant="outline" type="button" onClick={() => setIsAddModalOpen(false)}>
              Cancel
            </SoftButton>
            <SoftButton type="submit" isLoading={isSubmitting} disabled={!supplierCanManageProducts}>
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
              disabled={!supplierCanManageProducts}
            />
          </div>
          {!supplierCanManageProducts && (
            <p className="text-warning small mt-3 mb-0">{supplierRestrictionMessage}</p>
          )}
          <div className="d-flex justify-content-end gap-2">
            <SoftButton variant="outline" type="button" onClick={() => setIsEditStockModalOpen(false)}>
              Cancel
            </SoftButton>
            <SoftButton type="submit" isLoading={isSubmitting} disabled={!supplierCanManageProducts}>
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
            disabled={!supplierCanManageProducts}
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
                disabled={!supplierCanManageProducts}
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
              disabled={!supplierCanManageProducts}
            />
          </div>
          <div className="mb-3">
            <label className="soft-label d-block mb-1">Product Image</label>
            <input
              type="file"
              accept="image/*"
              className="soft-input w-100"
              onChange={e => setImageFile(e.target.files ? e.target.files[0] : null)}
              disabled={!supplierCanManageProducts}
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
                disabled={!supplierCanManageProducts}
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
                disabled={!supplierCanManageProducts}
              />
            </div>
          </div>
          {!supplierCanManageProducts && (
            <p className="text-warning small mt-3 mb-0">{supplierRestrictionMessage}</p>
          )}
          <div className="d-flex justify-content-end gap-2 mt-4">
            <SoftButton variant="outline" type="button" onClick={() => { setIsEditProductModalOpen(false); setImageFile(null); }}>
              Cancel
            </SoftButton>
            <SoftButton type="submit" isLoading={isSubmitting} disabled={!supplierCanManageProducts}>
              Save Changes
            </SoftButton>
          </div>
        </form>
      </SoftModal>

      <ConfirmDialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteProduct}
        title="Confirm Deletion"
        message="Are you sure you want to delete this product? This action cannot be undone."
        entityName={selectedProductAction?.nom}
        confirmLabel="Delete"
        isLoading={isSubmitting}
        loadingLabel="Deleting..."
      />
    </div>
  );
};
