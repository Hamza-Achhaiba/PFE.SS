import React, { useState, useEffect, useRef } from 'react';
import { fournisseursApi, reviewsApi } from '../../../api/fournisseurs.api';
import { profilApi } from '../../../api/profil.api';
import { categoriesApi, Categorie } from '../../../api/categories.api';
import { SoftSelect } from '../../../components/ui/SoftSelect';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftInput } from '../../../components/ui/SoftInput';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import {
  Truck, User, MapPin,
  ShieldCheck, TrendingUp, Package, Star, Clock,
  Save, Camera, MessageSquare
} from 'lucide-react';
import { toast } from 'react-toastify';
import { AuthStore } from '../../auth/auth.store';
import {
  Tooltip, ResponsiveContainer,
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Cell
} from 'recharts';

export const SupplierProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'reviews'>('overview');
  const [formData, setFormData] = useState({
    nom: '',
    nomEntreprise: '',
    description: '',
    telephone: '',
    adresse: '',
    infoContact: '',
    image: '',
    email: '',
    categorie: '',
    yearEstablished: 2024
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userId = AuthStore.getUserId();

    if (!userId) {
      console.error('No supplier ID found in auth token');
      setError('Impossible de trouver l\'identifiant du fournisseur. Veuillez vous reconnecter.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [profileData, reviewsData, categoriesData] = await Promise.all([
        fournisseursApi.getFournisseurById(userId),
        reviewsApi.getReviews(userId).catch(err => {
          console.warn('Failed to load reviews', err);
          return [];
        }),
        categoriesApi.getAll().catch(err => {
          console.warn('Failed to load categories', err);
          return [];
        })
      ]);

      setProfile(profileData);
      setReviews(reviewsData);
      setCategories(categoriesData);
      setFormData({
        nom: profileData.nom || '',
        nomEntreprise: profileData.nomEntreprise || '',
        description: profileData.description || '',
        telephone: profileData.telephone || '',
        adresse: profileData.adresse || '',
        infoContact: profileData.infoContact || '',
        image: profileData.image || '',
        email: profileData.email || '',
        categorie: profileData.categorie || '',
        yearEstablished: profileData.yearEstablished || 2024
      });
    } catch (error: any) {
      console.error('Failed to load profile data', error);
      if (error.response?.status === 403) {
        setError('Accès refusé. Vous n\'avez pas les permissions pour voir ce profil.');
      } else if (error.response?.status === 404) {
        setError('Profil non trouvé. Votre compte n\'est peut-être pas encore activé.');
      } else {
        setError(error.response?.data?.message || error.message || 'Impossible de charger le profil fournisseur. Veuillez réessayer plus tard.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await fournisseursApi.updateProfile(formData);
      toast.success('Profile updated successfully');
      setEditMode(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsSaving(true);
      const { url } = await profilApi.uploadImage(file);
      setFormData(prev => ({ ...prev, image: url }));
      // Update profile view immediately
      setProfile((prev: any) => ({ ...prev, image: url }));
      toast.success('Image uploaded successfully');
    } catch (error) {
      toast.error('Failed to upload image');
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (status: string): "success" | "warning" | "danger" | "info" | undefined => {
    switch (status) {
      case 'VERIFIED': return 'success';
      case 'ACTIVE': return 'success';
      case 'PENDING_APPROVAL': return 'warning';
      case 'SUSPENDED': return 'danger';
      case 'REJECTED': return 'danger';
      default: return 'info';
    }
  };

  const resolveImage = (url: string | undefined) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8088';
    return `${backendUrl}${url}`;
  };

  if (isLoading) return <SoftLoader />;

  if (error) {
    return (
      <div className="container-fluid py-5">
        <SoftCard className="text-center p-5">
          <div className="text-danger mb-4">
            <i className="bi bi-exclamation-triangle-fill" style={{ fontSize: '3rem' }}></i>
          </div>
          <h4 className="fw-bold mb-3">Erreur de chargement</h4>
          <p className="text-muted mb-4">{error}</p>
          <SoftButton onClick={loadData} variant="primary">
            Réessayer
          </SoftButton>
        </SoftCard>
      </div>
    );
  }

  if (!profile) return (
    <div className="p-5 text-center">
      <div className="h4 fw-bold text-muted mb-2">Profile not found</div>
      <p className="text-muted">We couldn't retrieve your business profile. Please try relogging or contact support.</p>
      <SoftButton onClick={loadData} variant="outline" className="mt-3">Retry Loading</SoftButton>
    </div>
  );

  const metricsData = [
    { name: 'On-time Delivery', value: profile.onTimeDelivery || 95, color: '#4e73df' },
    { name: 'Response Rate', value: profile.responseTime || 90, color: '#1cc88a' },
    { name: 'Quality Acceptance', value: profile.qualityAcceptance || 98, color: '#f6c23e' }
  ];

  return (
    <div className="container-fluid p-0 pb-5">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Company Profile</h4>
          <p className="text-muted mb-0">Manage your business information and track performance</p>
        </div>
        <SoftButton
          variant={editMode ? 'outline' : 'primary'}
          className="rounded-pill px-4"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? 'Cancel' : 'Edit Profile'}
        </SoftButton>
      </div>

      {/* Top Profile Card */}
      <SoftCard className="p-0 border-0 mb-4 overflow-hidden shadow-sm" style={{ borderRadius: '24px' }}>
        <div style={{
          height: '200px',
          background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)',
          position: 'relative'
        }}>
          {/* Subtle pattern overlay */}
          <div style={{
            position: 'absolute',
            top: 0, left: 0, right: 0, bottom: 0,
            opacity: 0.1,
            backgroundImage: 'radial-gradient(circle at 2px 2px, white 1px, transparent 0)',
            backgroundSize: '24px 24px'
          }}></div>
        </div>

        <div className="px-4 pb-4" style={{ marginTop: '-70px', position: 'relative', zIndex: 2 }}>
          <div className="d-flex flex-column flex-md-row align-items-end align-items-md-center gap-4">
            <div className="bg-white p-1 shadow-sm rounded-4 position-relative" style={{ width: '140px', height: '140px' }}>
              <div className="w-100 h-100 rounded-4 bg-light d-flex align-items-center justify-content-center overflow-hidden">
                {profile.image ? (
                  <img src={resolveImage(profile.image)!} alt={profile.nomEntreprise} className="w-100 h-100 object-fit-cover" />
                ) : (
                  <Truck size={48} className="text-primary" />
                )}
              </div>
              {editMode && (
                <>
                  <input
                    type="file"
                    ref={fileInputRef}
                    className="d-none"
                    accept="image/*"
                    onChange={handleImageUpload}
                  />
                  <button
                    type="button"
                    className="btn btn-primary btn-sm rounded-circle position-absolute bottom-0 end-0 p-2 shadow-lg border-white"
                    style={{ transform: 'translate(25%, 25%)' }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={16} />
                  </button>
                </>
              )}
            </div>

            <div className="flex-grow-1 pt-md-5 mt-2 mt-md-0">
              <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                <h1 className="fw-bold mb-0 text-dark" style={{ fontSize: '2.2rem', letterSpacing: '-0.5px' }}>
                  {profile.nomEntreprise}
                </h1>
                <SoftBadge variant={getStatusColor(profile.status)} className="d-flex align-items-center gap-1 py-1 px-3 rounded-pill shadow-sm">
                  {profile.status === 'VERIFIED' ? <ShieldCheck size={14} /> : <Clock size={14} />}
                  <span className="text-uppercase small fw-bold" style={{ letterSpacing: '0.5px' }}>
                    {profile.status?.replace('_', ' ') || 'ACTIVE'}
                  </span>
                </SoftBadge>
              </div>

              <div className="d-flex flex-wrap gap-x-4 gap-y-2 text-muted fw-medium">
                <span className="d-flex align-items-center gap-2 border-end pe-4">
                  <MapPin size={18} className="text-primary opacity-75" />
                  {profile.adresse}
                </span>
                <span className="d-flex align-items-center gap-2 border-end pe-4">
                  <div className="d-flex align-items-center text-warning">
                    <Star size={18} fill="currentColor" className="me-1" />
                    <span className="fw-bold text-dark">{profile.averageRating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <span className="small">({reviews.length} reviews)</span>
                </span>
                <span className="d-flex align-items-center gap-2">
                  <Clock size={18} className="text-primary opacity-75" />
                  Member since {profile.yearEstablished || '2022'}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SoftCard>

      {/* Section Tabs */}
      <div className="sticky-top bg-light/80 backdrop-blur-md py-3 mb-4" style={{ top: '0', zIndex: 10, margin: '0 -1.5rem', padding: '0 1.5rem' }}>
        <div className="d-flex gap-2 p-1 bg-white rounded-pill shadow-sm" style={{ maxWidth: 'fit-content' }}>
          <button
            className={`btn rounded-pill px-4 py-2 border-0 transition-all fw-bold ${activeTab === 'overview' ? 'btn-primary shadow-sm' : 'text-muted hover-bg-light'}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            className={`btn rounded-pill px-4 py-2 border-0 transition-all fw-bold ${activeTab === 'reviews' ? 'btn-primary shadow-sm' : 'text-muted hover-bg-light'}`}
            onClick={() => setActiveTab('reviews')}
          >
            Reviews ({reviews.length})
          </button>
        </div>
      </div>

      {activeTab === 'overview' ? (
        <div className="row g-4">
          <div className="col-lg-8">
            <SoftCard className="border-0 shadow-sm mb-4" style={{ borderRadius: '24px' }}>
              {editMode ? (
                <form onSubmit={handleSave}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <SoftInput
                        label="Contact Person Name"
                        value={formData.nom}
                        onChange={e => setFormData({ ...formData, nom: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <SoftInput
                        label="Email Address"
                        value={formData.email}
                        onChange={e => setFormData({ ...formData, email: e.target.value })}
                        required
                        type="email"
                      />
                    </div>
                    <div className="col-md-6">
                      <SoftInput
                        label="Company Trade Name"
                        value={formData.nomEntreprise}
                        onChange={e => setFormData({ ...formData, nomEntreprise: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <SoftSelect
                        label="Category"
                        value={formData.categorie}
                        options={categories}
                        onChange={val => setFormData({ ...formData, categorie: val })}
                      />
                    </div>
                    <div className="col-md-3">
                      <SoftInput
                        label="Year Established"
                        value={formData.yearEstablished}
                        onChange={e => setFormData({ ...formData, yearEstablished: parseInt(e.target.value) || 2024 })}
                        type="number"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">About Company / Business Description</label>
                      <textarea
                        className="form-control border-0 bg-light rounded-4 p-3"
                        rows={4}
                        value={formData.description}
                        onChange={e => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Tell clients about your quality, history, and values..."
                      />
                    </div>
                    <div className="col-md-6">
                      <SoftInput
                        label="Business Phone"
                        value={formData.telephone}
                        onChange={e => setFormData({ ...formData, telephone: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <SoftInput
                        label="Full Business Address"
                        value={formData.adresse}
                        onChange={e => setFormData({ ...formData, adresse: e.target.value })}
                        required
                      />
                    </div>
                    <div className="col-12 text-end mt-4">
                      <SoftButton type="submit" isLoading={isSaving} className="rounded-pill px-5">
                        <Save size={18} className="me-2" /> Save Changes
                      </SoftButton>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="p-4 bg-light rounded-4 h-100">
                      <div className="d-flex align-items-center gap-3 mb-3 text-primary">
                        <User size={20} />
                        <h6 className="fw-bold mb-0">Contact Information</h6>
                      </div>
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <div className="small text-muted">Full Name</div>
                          <div className="fw-bold">{profile.nom}</div>
                        </div>
                        <div>
                          <div className="small text-muted">Email</div>
                          <div className="fw-bold">{profile.email}</div>
                        </div>
                        <div>
                          <div className="small text-muted">Phone</div>
                          <div className="fw-bold">{profile.telephone}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="p-4 bg-light rounded-4 h-100">
                      <div className="d-flex align-items-center gap-3 mb-3 text-primary">
                        <ShieldCheck size={20} />
                        <h6 className="fw-bold mb-0">Company Info</h6>
                      </div>
                      <div className="d-flex flex-column gap-3">
                        <div>
                          <div className="small text-muted">Company Name</div>
                          <div className="fw-bold">{profile.nomEntreprise}</div>
                        </div>
                        <div>
                          <div className="small text-muted">Category</div>
                          <div className="fw-bold">{profile.categorie || 'General Supplier'}</div>
                        </div>
                        <div>
                          <div className="small text-muted">Year Established</div>
                          <div className="fw-bold">{profile.yearEstablished || '2024'}</div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="p-4 bg-light rounded-4">
                      <div className="d-flex align-items-center gap-3 mb-3 text-primary">
                        <Package size={20} />
                        <h6 className="fw-bold mb-0">About Company</h6>
                      </div>
                      <p className="text-body mb-0" style={{ lineHeight: '1.7' }}>
                        {profile.description || "Leading distributor and wholesale partner specialized in high-quality consumer goods. We focus on reliability, competitive pricing, and sustainable supply chains."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </SoftCard>

            <div className="row g-4">
              <div className="col-12">
                <SoftCard title="Marketplace Statistics" className="border-0 shadow-sm h-100" style={{ borderRadius: '24px' }}>
                  <div className="row g-2">
                    <div className="col-3">
                      <div className="p-3 bg-light rounded-4 text-center">
                        <div className="h4 fw-bold mb-0 text-primary">124</div>
                        <div className="small text-muted">Orders</div>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-3 bg-light rounded-4 text-center">
                        <div className="h4 fw-bold mb-0 text-success">45</div>
                        <div className="small text-muted">Customers</div>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-3 bg-light rounded-4 text-center">
                        <div className="h4 fw-bold mb-0 text-info">12</div>
                        <div className="small text-muted">Badges</div>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="p-3 bg-light rounded-4 text-center">
                        <div className="h4 fw-bold mb-0 text-warning">4.8</div>
                        <div className="small text-muted">Quality Score</div>
                      </div>
                    </div>
                  </div>
                </SoftCard>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <SoftCard className="border-0 shadow-sm mb-4" style={{ borderRadius: '24px' }}>
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="bg-primary-subtle p-3 rounded-4 text-primary"><TrendingUp size={24} /></div>
                  <h5 className="fw-bold mb-0 text-dark">Performance Analytics</h5>
                </div>
                <SoftBadge variant="info" className="rounded-pill px-3 py-1">Live Data</SoftBadge>
              </div>

              <div style={{ height: '240px', width: '100%' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={metricsData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis
                      dataKey="name"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11, fontWeight: 500 }}
                    />
                    <YAxis
                      domain={[0, 100]}
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#94a3b8', fontSize: 11 }}
                    />
                    <Tooltip
                      cursor={{ fill: 'rgba(241, 245, 249, 0.5)' }}
                      contentStyle={{
                        borderRadius: '16px',
                        border: 'none',
                        boxShadow: '0 10px 30px rgba(0,0,0,0.1)',
                        padding: '12px 16px',
                        backgroundColor: '#fff'
                      }}
                    />
                    <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={45}>
                      {metricsData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} fillOpacity={0.8} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              <div className="d-flex flex-column gap-3 mt-4">
                {metricsData.map(m => (
                  <div key={m.name} className="p-3 bg-white border border-light rounded-4 shadow-sm hover-translate-y transition-all">
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: m.color }}></div>
                        <span className="small text-muted fw-bold text-uppercase" style={{ letterSpacing: '0.5px', fontSize: '10px' }}>{m.name}</span>
                      </div>
                      <span className="fw-bold" style={{ color: m.color }}>{m.value}%</span>
                    </div>
                    <div className="bg-light rounded-pill overflow-hidden" style={{ height: '6px' }}>
                      <div
                        className="h-100 transition-all duration-1000 ease-out"
                        style={{
                          width: `${m.value}%`,
                          backgroundColor: m.color,
                          boxShadow: `0 0 10px ${m.color}40`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </SoftCard>

            <SoftCard className="border-0 shadow-sm" style={{ borderRadius: '24px' }}>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="bg-primary-subtle p-3 rounded-4 text-primary"><Star size={24} /></div>
                <h5 className="fw-bold mb-0">Marketplace Rating</h5>
              </div>
              <div className="text-center py-3">
                <div className="display-4 fw-bold mb-1">{profile.averageRating?.toFixed(1) || '0.0'}</div>
                <div className="d-flex justify-content-center gap-1 text-warning mb-3">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={20} fill={s <= Math.round(profile.averageRating || 0) ? 'currentColor' : 'none'} />
                  ))}
                </div>
                <hr className="my-4 opacity-10" />
                <div className="d-flex justify-content-around">
                  <div>
                    <div className="fw-bold">{reviews.length}</div>
                    <div className="text-muted small">Reviews</div>
                  </div>
                  <div className="border-end"></div>
                  <div>
                    <div className="fw-bold">{profile.averageRating?.toFixed(1) || '0.0'}</div>
                    <div className="text-muted small">Avg Score</div>
                  </div>
                </div>
              </div>
            </SoftCard>
          </div>
        </div>
      ) : (
        <div className="row g-4">
          <div className="col-12">
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
                  <p className="text-muted">No reviews yet from marketplace clients.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
