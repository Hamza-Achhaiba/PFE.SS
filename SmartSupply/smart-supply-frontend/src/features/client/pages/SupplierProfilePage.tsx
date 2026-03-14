import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { fournisseursApi, reviewsApi } from '../../../api/fournisseurs.api';
import { Produit } from '../../../api/types';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { SoftModal } from '../../../components/ui/SoftModal';
import { SoftInput } from '../../../components/ui/SoftInput';
import { 
  Truck, MapPin, Phone, Mail, User, Info, Package, Star, 
  Calendar, MessageSquare, Heart, Clock, ShieldCheck,
  TrendingUp, Plus
} from 'lucide-react';
import { cartApi } from '../../../api/cart.api';
import { favorisApi } from '../../../api/favoris.api';
import { toast } from 'react-toastify';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export const SupplierProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [supplier, setSupplier] = useState<any | null>(null);
  const [products, setProducts] = useState<Produit[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [isFavorite, setIsFavorite] = useState(false);
  
  // Selection for cart modal
  const [selectedProduct, setSelectedProduct] = useState<Produit | null>(null);
  const [quantity, setQuantity] = useState<number>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Review form state
  const [showReviewModal, setShowReviewModal] = useState(false);
  const [newRating, setNewRating] = useState(5);
  const [newComment, setNewComment] = useState('');

  useEffect(() => {
    if (id) {
      const supplierId = parseInt(id);
      loadData(supplierId);
    }
  }, [id]);

  const loadData = async (supplierId: number) => {
    setIsLoading(true);
    try {
      const [supplierData, productsData, reviewsData, favoritesData] = await Promise.all([
        fournisseursApi.getFournisseurById(supplierId),
        fournisseursApi.getFournisseurProduits(supplierId),
        reviewsApi.getReviews(supplierId),
        favorisApi.getFavorites()
      ]);
      setSupplier(supplierData);
      setProducts(productsData);
      setReviews(reviewsData);
      setIsFavorite(favoritesData.some((f: any) => f.id === supplierId));
    } catch (error) {
      console.error('Failed to load supplier data', error);
      toast.error('Failed to load supplier profile');
    } finally {
      setIsLoading(false);
    }
  };

  const resolveImage = (url: string | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8088';
    return `${backendUrl}${url}`;
  };

  const toggleFavorite = async () => {
    if (!supplier) return;
    try {
      if (isFavorite) {
        await favorisApi.removeFavorite(supplier.id);
        toast.info('Removed from favorites');
      } else {
        await favorisApi.addFavorite(supplier.id);
        toast.success('Added to favorites');
      }
      setIsFavorite(!isFavorite);
    } catch (error) {
      toast.error('Operation failed');
    }
  };

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supplier) return;
    setIsSubmitting(true);
    try {
      await reviewsApi.submitReview({
        fournisseurId: supplier.id,
        rating: newRating,
        comment: newComment
      });
      toast.success('Review submitted successfully');
      setShowReviewModal(false);
      setNewComment('');
      setNewRating(5);
      // Reload reviews
      const updatedReviews = await reviewsApi.getReviews(supplier.id);
      setReviews(updatedReviews);
    } catch (error) {
      toast.error('Failed to submit review');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddToCart = (product: Produit) => {
    setSelectedProduct(product);
    setQuantity(product.quantiteMinimumCommande || 1);
  };

  const confirmAddToCart = async (e: React.FormEvent) => {
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
  if (!supplier) return <div className="text-center p-5">Supplier not found</div>;

  const metricsData = [
    { name: 'On-time', value: supplier.onTimeDelivery || 95, color: '#4e73df' },
    { name: 'Response', value: supplier.responseTime || 90, color: '#1cc88a' },
    { name: 'Quality', value: supplier.qualityAcceptance || 98, color: '#f6c23e' }
  ];

  return (
    <div className="container-fluid p-0 pb-5">
      {/* Header Profile Card */}
      <SoftCard className="p-0 border-0 mb-4 overflow-hidden shadow-sm" style={{ borderRadius: '24px' }}>
        <div style={{ height: '200px', background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', opacity: 0.9 }}></div>
        <div className="px-4 pb-4" style={{ marginTop: '-80px' }}>
          <div className="d-flex flex-column flex-md-row align-items-end align-items-md-center gap-4">
            <div 
              className="bg-white p-1 shadow-sm rounded-circle" 
              style={{ width: '140px', height: '140px', zIndex: 1 }}
            >
              <div className="w-100 h-100 rounded-circle bg-light d-flex align-items-center justify-content-center overflow-hidden">
                {supplier.image ? (
                  <img src={resolveImage(supplier.image)!} alt={supplier.nomEntreprise} className="w-100 h-100 object-fit-cover" />
                ) : (
                  <Truck size={64} className="text-primary" />
                )}
              </div>
            </div>
            
            <div className="flex-grow-1 pt-md-4 mt-2 mt-md-0">
              <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                <h1 className="fw-bold mb-0" style={{ fontSize: '2rem' }}>{supplier.nomEntreprise}</h1>
                <SoftBadge 
                  variant={supplier.status === 'VERIFIED' || supplier.status === 'ACTIVE' ? 'success' : supplier.status === 'PENDING_APPROVAL' ? 'warning' : 'danger'} 
                  className="d-flex align-items-center gap-1 py-1 px-2 rounded-pill"
                >
                  {supplier.status === 'VERIFIED' ? <ShieldCheck size={14} /> : <Clock size={14} />} 
                  {supplier.status?.replace('_', ' ') || 'ACTIVE'}
                </SoftBadge>
              </div>
              <div className="d-flex flex-wrap gap-4 text-muted mb-3">
                <span className="d-flex align-items-center gap-2 border-end pe-4"><MapPin size={16} className="text-primary" /> {supplier.adresse}</span>
                <span className="d-flex align-items-center gap-2 border-end pe-4">
                  <div className="d-flex align-items-center text-warning">
                    <Star size={16} fill="currentColor" className="me-1" />
                    <span className="fw-bold text-dark">{supplier.averageRating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <span className="small">({reviews.length} reviews)</span>
                </span>
                <span className="d-flex align-items-center gap-2"><Calendar size={16} className="text-primary" /> Established {supplier.yearEstablished || '2022'}</span>
              </div>
            </div>

            <div className="d-flex gap-2 mb-2">
              <SoftButton variant="primary" className="px-4 py-2 rounded-pill d-flex align-items-center gap-2">
                <MessageSquare size={18} /> Message
              </SoftButton>
              <SoftButton 
                variant={isFavorite ? 'primary' : 'outline'} 
                className="px-3 py-2 rounded-pill shadow-sm"
                onClick={toggleFavorite}
              >
                <Heart size={20} fill={isFavorite ? 'white' : 'none'} className={isFavorite ? 'text-white' : ''} />
              </SoftButton>
            </div>
          </div>
        </div>
      </SoftCard>

      {/* Tabs Navigation */}
      <div className="d-flex gap-2 mb-4 p-1 bg-white rounded-pill shadow-sm sticky-top" style={{ maxWidth: 'fit-content', top: '20px', zIndex: 10 }}>
        <button 
          className={`btn rounded-pill px-4 py-2 border-0 transition-all ${activeTab === 'overview' ? 'btn-primary shadow-sm' : 'text-muted'}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button 
          className={`btn rounded-pill px-4 py-2 border-0 transition-all ${activeTab === 'reviews' ? 'btn-primary shadow-sm' : 'text-muted'}`}
          onClick={() => setActiveTab('reviews')}
        >
          Reviews ({reviews.length})
        </button>
      </div>

      {activeTab === 'overview' ? (
        <div className="row g-4">
          {/* Left Column: Details */}
          <div className="col-lg-8">
            <div className="row g-4 mb-4">
               <div className="col-md-6">
                  <SoftCard className="h-100 border-0 shadow-sm" style={{ borderRadius: '24px' }}>
                    <div className="d-flex align-items-center gap-3 mb-4">
                       <div className="bg-primary-subtle p-3 rounded-4 text-primary"><Info size={24} /></div>
                       <h5 className="fw-bold mb-0">About Company</h5>
                    </div>
                    <p className="text-muted" style={{ lineHeight: '1.7', textAlign: 'justify' }}>
                      {supplier.description || "Leading distributor and wholesale partner specialized in high-quality consumer goods for local shops and retailers. We focus on reliability, competitive pricing, and sustainable supply chains."}
                    </p>
                  </SoftCard>
               </div>
               <div className="col-md-6">
                  <SoftCard className="h-100 border-0 shadow-sm" style={{ borderRadius: '24px' }}>
                    <div className="d-flex align-items-center gap-3 mb-4">
                       <div className="bg-info-subtle p-3 rounded-4 text-info"><User size={24} /></div>
                       <h5 className="fw-bold mb-0">Company Details</h5>
                    </div>
                    <div className="d-flex flex-column gap-3">
                       <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded-3">
                          <span className="text-muted small">Category</span>
                          <span className="fw-bold small">Wholesale Distributor</span>
                       </div>
                       <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded-3">
                          <span className="text-muted small">Year Est.</span>
                          <span className="fw-bold small">{supplier.yearEstablished || '2022'}</span>
                       </div>
                       <div className="d-flex justify-content-between align-items-center p-2 bg-light rounded-3">
                          <span className="text-muted small">Tax ID</span>
                          <span className="fw-bold small">MA-{supplier.id}938485</span>
                       </div>
                    </div>
                  </SoftCard>
               </div>
            </div>

            <SoftCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '24px' }}>
               <div className="d-flex justify-content-between align-items-center mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <div className="bg-warning-subtle p-3 rounded-4 text-warning"><Package size={24} /></div>
                    <h5 className="fw-bold mb-0">Supplier Catalog</h5>
                  </div>
                  <Link to={`/client/catalog?supplier=${encodeURIComponent(supplier.nomEntreprise)}`} className="btn btn-link text-primary p-0 fw-bold">
                    View Catalog
                  </Link>
               </div>
               <div className="row g-3">
                  {products.slice(0, 6).map(p => (
                    <div className="col-sm-6 col-md-4" key={p.id}>
                      <div className="p-2 border rounded-4 hover-translate-y transition-all">
                        <div className="bg-light rounded-3 overflow-hidden mb-2" style={{ height: '100px' }}>
                          <img src={resolveImage(p.image) || ''} alt={p.nom} className="w-100 h-100 object-fit-cover" />
                        </div>
                        <h6 className="small fw-bold mb-1 text-truncate">{p.nom}</h6>
                        <div className="d-flex justify-content-between align-items-center">
                          <span className="text-primary fw-bold small">{p.prixUnitaire} DH</span>
                          <button 
                            className="btn btn-sm btn-light rounded-circle p-1"
                            onClick={() => handleAddToCart(p)}
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
               </div>
            </SoftCard>
          </div>

          {/* Right Column: Performance & Contact */}
          <div className="col-lg-4">
            <SoftCard className="mb-4 border-0 shadow-sm" style={{ borderRadius: '24px' }}>
               <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="bg-success-subtle p-3 rounded-4 text-success"><TrendingUp size={24} /></div>
                  <h5 className="fw-bold mb-0">Performance</h5>
               </div>
               <div style={{ height: '220px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metricsData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <YAxis domain={[0, 105]} axisLine={false} tickLine={false} tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                      />
                      <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                        {metricsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
               </div>
               <div className="row g-2 mt-2">
                  <div className="col-4 text-center">
                    <div className="small fw-bold" style={{ color: '#4e73df' }}>{supplier.onTimeDelivery || 95}%</div>
                    <div className="text-muted" style={{ fontSize: '10px' }}>Delivery</div>
                  </div>
                  <div className="col-4 text-center">
                    <div className="small fw-bold" style={{ color: '#1cc88a' }}>{supplier.responseTime || 90}%</div>
                    <div className="text-muted" style={{ fontSize: '10px' }}>Response</div>
                  </div>
                  <div className="col-4 text-center">
                    <div className="small fw-bold" style={{ color: '#f6c23e' }}>{supplier.qualityAcceptance || 98}%</div>
                    <div className="text-muted" style={{ fontSize: '10px' }}>Quality</div>
                  </div>
               </div>
            </SoftCard>

            <SoftCard className="border-0 shadow-sm" style={{ borderRadius: '24px' }}>
               <div className="d-flex align-items-center gap-3 mb-4">
                  <div className="bg-info-subtle p-3 rounded-4 text-info"><Phone size={24} /></div>
                  <h5 className="fw-bold mb-0">Contact Info</h5>
               </div>
               <div className="d-flex flex-column gap-3">
                  <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-4">
                    <div className="bg-white p-2 rounded-circle text-primary shadow-sm"><Phone size={18} /></div>
                    <div>
                      <div className="small text-muted">Phone Number</div>
                      <div className="fw-bold">{supplier.telephone}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-4">
                    <div className="bg-white p-2 rounded-circle text-primary shadow-sm"><Mail size={18} /></div>
                    <div>
                      <div className="small text-muted">Email Address</div>
                      <div className="fw-bold text-truncate" style={{ maxWidth: '180px' }}>{supplier.email}</div>
                    </div>
                  </div>
                  <div className="d-flex align-items-center gap-3 p-3 bg-light rounded-4">
                    <div className="bg-white p-2 rounded-circle text-primary shadow-sm"><Info size={18} /></div>
                    <div>
                       <div className="small text-muted">Business Name</div>
                       <div className="fw-bold">{supplier.nomEntreprise}</div>
                    </div>
                  </div>
               </div>
            </SoftCard>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-lg-4">
            <SoftCard className="border-0 shadow-sm text-center p-4 bg-primary text-white" style={{ borderRadius: '24px' }}>
              <div className="h1 fw-bold mb-1" style={{ fontSize: '3.5rem' }}>{supplier.averageRating?.toFixed(1) || '0.0'}</div>
              <div className="d-flex justify-content-center gap-1 mb-3 text-warning">
                {[1, 2, 3, 4, 5].map(s => (
                  <Star key={s} size={24} fill={s <= Math.round(supplier.averageRating || 0) ? 'currentColor' : 'none'} />
                ))}
              </div>
              <p className="mb-4 opacity-75">Based on {reviews.length} actual customer reviews from the marketplace.</p>
              <SoftButton 
                className="w-100 bg-white text-primary border-0 rounded-pill py-3 fw-bold"
                onClick={() => setShowReviewModal(true)}
              >
                Write a Review
              </SoftButton>
            </SoftCard>
            
            <div className="mt-4 d-flex flex-column gap-2">
              {[5, 4, 3, 2, 1].map(star => {
                const count = reviews.filter(r => r.rating === star).length;
                const percentage = reviews.length > 0 ? (count / reviews.length) * 100 : 0;
                return (
                  <div key={star} className="d-flex align-items-center gap-3">
                    <span className="small fw-bold text-nowrap" style={{ width: '15px' }}>{star}</span>
                    <div className="flex-grow-1 bg-white rounded-pill overflow-hidden shadow-inset" style={{ height: '8px' }}>
                      <div className="bg-warning h-100" style={{ width: `${percentage}%` }}></div>
                    </div>
                    <span className="small text-muted" style={{ width: '30px' }}>{count}</span>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="col-lg-8">
            <div className="d-flex flex-column gap-3">
               {reviews.map(review => (
                 <SoftCard key={review.id} className="border-0 shadow-sm p-4" style={{ borderRadius: '24px' }}>
                   <div className="d-flex justify-content-between align-items-start mb-3">
                      <div className="d-flex align-items-center gap-3">
                         <div className="bg-light p-3 rounded-circle text-primary fw-bold d-flex align-items-center justify-content-center shadow-sm" style={{ width: '48px', height: '48px' }}>
                            {review.clientName?.charAt(0) || 'C'}
                         </div>
                         <div>
                            <h6 className="fw-bold mb-0">{review.clientName}</h6>
                            <div className="text-muted small">{new Date(review.createdAt).toLocaleDateString()}</div>
                         </div>
                      </div>
                      <div className="d-flex gap-1 text-warning">
                         {[1, 2, 3, 4, 5].map(s => (
                           <Star key={s} size={14} fill={s <= review.rating ? 'currentColor' : 'none'} />
                         ))}
                      </div>
                   </div>
                   <p className="text-muted mb-0" style={{ lineHeight: '1.6' }}>{review.comment}</p>
                 </SoftCard>
               ))}
               {reviews.length === 0 && (
                 <div className="text-center py-5 bg-white rounded-4 border-dashed border-2 opacity-50">
                    <MessageSquare size={48} className="text-muted mb-3 opacity-20" />
                    <p className="text-muted">No reviews yet. Be the first to review this supplier!</p>
                 </div>
               )}
            </div>
          </div>
        </div>
      )}

      {/* Cart Modal */}
      <SoftModal
        isOpen={selectedProduct !== null}
        onClose={() => setSelectedProduct(null)}
        title="Add to Cart"
      >
        {selectedProduct && (
          <form onSubmit={confirmAddToCart}>
            <div className="d-flex align-items-center mb-4 p-3 bg-light rounded-4">
              <div className="bg-white p-1 rounded-3 me-3 overflow-hidden shadow-sm" style={{ width: '80px', height: '80px' }}>
                <img src={resolveImage(selectedProduct.image) || ''} alt={selectedProduct.nom} className="w-100 h-100 object-fit-cover" />
              </div>
              <div>
                <h6 className="fw-bold mb-1">{selectedProduct.nom}</h6>
                <div className="text-primary fw-bold" style={{ fontSize: '1.2rem' }}>{selectedProduct.prixUnitaire} DH</div>
                <div className="small text-muted">{selectedProduct.stockDisponible} available</div>
              </div>
            </div>
            <div className="mb-4">
              <SoftInput
                label="Quantity to Order"
                type="number"
                min={selectedProduct.quantiteMinimumCommande || 1}
                max={selectedProduct.stockDisponible}
                required
                value={quantity}
                onChange={e => setQuantity(parseInt(e.target.value) || 1)}
                className="rounded-4"
              />
            </div>
            <div className="d-flex justify-content-end gap-2">
              <SoftButton variant="outline" type="button" className="px-4 rounded-pill" onClick={() => setSelectedProduct(null)}>Cancel</SoftButton>
              <SoftButton type="submit" className="px-5 rounded-pill" isLoading={isSubmitting}>Confirm</SoftButton>
            </div>
          </form>
        )}
      </SoftModal>

      {/* Review Modal */}
      <SoftModal
        isOpen={showReviewModal}
        onClose={() => setShowReviewModal(false)}
        title="Rate this Supplier"
      >
         <form onSubmit={handleSubmitReview}>
            <div className="text-center mb-4">
               <p className="text-muted mb-3">How was your experience ordering from this supplier?</p>
               <div className="d-flex justify-content-center gap-2 mb-2">
                  {[1, 2, 3, 4, 5].map(star => (
                    <button 
                      key={star} 
                      type="button"
                      className="btn btn-link p-1 transition-all"
                      style={{ color: star <= newRating ? '#f6c23e' : '#e3e6f0' }}
                      onClick={() => setNewRating(star)}
                    >
                      <Star size={36} fill={star <= newRating ? 'currentColor' : 'none'} />
                    </button>
                  ))}
               </div>
               <div className="fw-bold text-warning">
                  {newRating === 5 ? 'Excellent!' : newRating === 4 ? 'Very Good' : newRating === 3 ? 'Good' : newRating === 2 ? 'Fair' : 'Poor'}
               </div>
            </div>
            <div className="mb-4">
               <label className="form-label small fw-bold text-muted">Your Comment</label>
               <textarea 
                 className="form-control border-0 bg-light rounded-4 p-3" 
                 rows={4}
                 placeholder="Tell us about the quality, delivery time, etc..."
                 value={newComment}
                 onChange={e => setNewComment(e.target.value)}
                 required
               ></textarea>
            </div>
            <div className="d-flex justify-content-end gap-2">
               <SoftButton variant="outline" type="button" className="px-4 rounded-pill" onClick={() => setShowReviewModal(false)}>Cancel</SoftButton>
               <SoftButton type="submit" className="px-5 rounded-pill" isLoading={isSubmitting}>Submit Review</SoftButton>
            </div>
         </form>
      </SoftModal>
    </div>
  );
};
