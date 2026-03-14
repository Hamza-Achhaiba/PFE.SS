import React, { useState, useEffect, useRef } from 'react';
import { fournisseursApi, reviewsApi } from '../../../api/fournisseurs.api';
import { profilApi } from '../../../api/profil.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftInput } from '../../../components/ui/SoftInput';
import { SoftBadge } from '../../../components/ui/SoftBadge';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { 
  Truck, User, MapPin, 
  ShieldCheck, TrendingUp, Package, Star, Clock,
  Save, Camera, Linkedin, Twitter, MessageSquare
} from 'lucide-react';
import { toast } from 'react-toastify';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, Cell
} from 'recharts';

export const SupplierProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    image: ''
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user') || '{}');
      if (userData.id) {
        const [profileData, reviewsData] = await Promise.all([
          fournisseursApi.getFournisseurById(userData.id),
          reviewsApi.getReviews(userData.id)
        ]);
        
        setProfile(profileData);
        setReviews(reviewsData);
        setFormData({
          nom: profileData.nom || '',
          nomEntreprise: profileData.nomEntreprise || '',
          description: profileData.description || '',
          telephone: profileData.telephone || '',
          adresse: profileData.adresse || '',
          infoContact: profileData.infoContact || '',
          image: profileData.image || ''
        });
      }
    } catch (error) {
      toast.error('Failed to load profile data');
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
  if (!profile) return <div className="p-5 text-center">Profile not found</div>;

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
        <div style={{ height: '160px', background: 'linear-gradient(135deg, #6a11cb 0%, #2575fc 100%)', opacity: 0.9 }}></div>
        <div className="px-4 pb-4" style={{ marginTop: '-60px' }}>
          <div className="d-flex flex-column flex-md-row align-items-end align-items-md-center gap-4">
            <div className="bg-white p-1 shadow-sm rounded-circle position-relative" style={{ width: '120px', height: '120px' }}>
              <div className="w-100 h-100 rounded-circle bg-light d-flex align-items-center justify-content-center overflow-hidden">
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
                    className="btn btn-primary btn-sm rounded-circle position-absolute bottom-0 end-0 p-2 shadow border-white"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={14} />
                  </button>
                </>
              )}
            </div>
            
            <div className="flex-grow-1 pt-md-4 mt-2 mt-md-0">
              <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                <h2 className="fw-bold mb-0">{profile.nomEntreprise}</h2>
                <SoftBadge variant={getStatusColor(profile.status)} className="d-flex align-items-center gap-1 py-1 px-2 rounded-pill">
                  {profile.status === 'VERIFIED' ? <ShieldCheck size={14} /> : <Clock size={14} />} 
                  {profile.status?.replace('_', ' ') || 'ACTIVE'}
                </SoftBadge>
              </div>
              <div className="d-flex flex-wrap gap-4 text-muted mb-0">
                <span className="d-flex align-items-center gap-2 border-end pe-4"><MapPin size={16} className="text-primary" /> {profile.adresse}</span>
                <span className="d-flex align-items-center gap-2 border-end pe-4">
                  <div className="d-flex align-items-center text-warning">
                    <Star size={16} fill="currentColor" className="me-1" />
                    <span className="fw-bold text-dark">{profile.averageRating?.toFixed(1) || '0.0'}</span>
                  </div>
                  <span className="small">({reviews.length} reviews)</span>
                </span>
                <span className="d-flex align-items-center gap-2"><Clock size={16} className="text-primary" /> Member since {profile.yearEstablished || '2022'}</span>
              </div>
            </div>
          </div>
        </div>
      </SoftCard>

      {/* Section Tabs */}
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
          <div className="col-lg-8">
            <SoftCard className="border-0 shadow-sm mb-4" style={{ borderRadius: '24px' }}>
              {editMode ? (
                <form onSubmit={handleSave}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <SoftInput 
                        label="Full Name / Contact Person" 
                        value={formData.nom}
                        onChange={e => setFormData({...formData, nom: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <SoftInput 
                        label="Company Trade Name" 
                        value={formData.nomEntreprise}
                        onChange={e => setFormData({...formData, nomEntreprise: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">Business Description</label>
                      <textarea 
                        className="form-control border-0 bg-light rounded-4 p-3"
                        rows={4}
                        value={formData.description}
                        onChange={e => setFormData({...formData, description: e.target.value})}
                        placeholder="Tell clients about your quality, history, and values..."
                      />
                    </div>
                    <div className="col-md-6">
                      <SoftInput 
                        label="Business Phone" 
                        value={formData.telephone}
                        onChange={e => setFormData({...formData, telephone: e.target.value})}
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <SoftInput 
                        label="Business Address" 
                        value={formData.adresse}
                        onChange={e => setFormData({...formData, adresse: e.target.value})}
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
                            <div className="small text-muted">Address</div>
                            <div className="fw-bold">{profile.adresse}</div>
                          </div>
                          <div>
                            <div className="small text-muted">Category</div>
                            <div className="fw-bold">General Supplier</div>
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
              <div className="col-md-6">
                <SoftCard title="Social Presence" className="border-0 shadow-sm h-100" style={{ borderRadius: '24px' }}>
                  <div className="d-flex flex-column gap-3">
                    <div className="d-flex align-items-center justify-content-between p-2 rounded-3 hover-bg-light transition-all">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-primary text-white p-2 rounded-3"><Linkedin size={18} /></div>
                        <span className="small fw-bold">LinkedIn</span>
                      </div>
                      <span className="text-muted small">Connected</span>
                    </div>
                    <div className="d-flex align-items-center justify-content-between p-2 rounded-3 hover-bg-light transition-all">
                      <div className="d-flex align-items-center gap-3">
                        <div className="bg-info text-white p-2 rounded-3"><Twitter size={18} /></div>
                        <span className="small fw-bold">Twitter / X</span>
                      </div>
                      <span className="text-muted small">Not Linked</span>
                    </div>
                  </div>
                </SoftCard>
              </div>
              <div className="col-md-6">
                <SoftCard title="Marketplace Statistics" className="border-0 shadow-sm h-100" style={{ borderRadius: '24px' }}>
                   <div className="row g-2">
                     <div className="col-6">
                        <div className="p-3 bg-light rounded-4 text-center">
                           <div className="h4 fw-bold mb-0 text-primary">124</div>
                           <div className="small text-muted">Orders</div>
                        </div>
                     </div>
                     <div className="col-6">
                        <div className="p-3 bg-light rounded-4 text-center">
                           <div className="h4 fw-bold mb-0 text-success">45</div>
                           <div className="small text-muted">Customers</div>
                        </div>
                     </div>
                   </div>
                </SoftCard>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <SoftCard className="border-0 shadow-sm mb-4" style={{ borderRadius: '24px' }}>
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="bg-warning-subtle p-3 rounded-4 text-warning"><TrendingUp size={24} /></div>
                <h5 className="fw-bold mb-0">Performance Metrics</h5>
              </div>
              <div style={{ height: '240px', width: '100%' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={metricsData} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#eee" />
                      <XAxis type="number" domain={[0, 100]} hide />
                      <YAxis dataKey="name" type="category" hide />
                      <Tooltip 
                        cursor={{ fill: 'rgba(0,0,0,0.02)' }}
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                      />
                      <Bar dataKey="value" radius={[0, 6, 6, 0]} barSize={20}>
                        {metricsData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
              </div>
              <div className="d-flex flex-column gap-3 mt-4">
                 {metricsData.map(m => (
                   <div key={m.name} className="p-3 bg-light rounded-4">
                      <div className="d-flex justify-content-between align-items-center mb-1">
                         <span className="small text-muted fw-bold">{m.name}</span>
                         <span className="fw-bold" style={{ color: m.color }}>{m.value}%</span>
                      </div>
                      <div className="bg-white rounded-pill overflow-hidden" style={{ height: '6px' }}>
                         <div className="h-100" style={{ width: `${m.value}%`, backgroundColor: m.color }}></div>
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
