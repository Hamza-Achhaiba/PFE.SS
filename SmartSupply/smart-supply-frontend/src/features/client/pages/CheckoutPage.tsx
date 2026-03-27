import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { cartApi } from '../../../api/cart.api';
import { ordersApi } from '../../../api/orders.api';
import { profilApi } from '../../../api/profil.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftButton } from '../../../components/ui/SoftButton';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { toast } from 'react-toastify';
import { PanierResponse } from '../../../api/types';
import { ShoppingCart, User, Phone, MapPin, CreditCard, Banknote, ChevronLeft, Minus, Plus, ShieldCheck } from 'lucide-react';

const resolveImage = (url: string) => {
    if (!url) return null;
    if (url.startsWith('http')) return url;
    const backendUrl = import.meta.env.VITE_API_URL || 'http://localhost:8087';
    return `${backendUrl}${url}`;
};

export const CheckoutPage: React.FC = () => {
    const [panier, setPanier] = useState<PanierResponse | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        nomComplet: '',
        telephone: '',
        adresse: '',
        ville: '',
        region: '',
        codePostal: '',
        methodePaiement: 'CASH_ON_DELIVERY'
    });

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [panierData, profileData] = await Promise.all([
                    cartApi.getPanier(),
                    profilApi.getMonProfil()
                ]);
                
                setPanier(panierData);
                
                if (profileData) {
                    setFormData(prev => ({
                        ...prev,
                        nomComplet: profileData.nom || '',
                        telephone: profileData.telephone || '',
                        adresse: profileData.adresse || ''
                    }));
                }

                if (!panierData || panierData.lignes.length === 0) {
                    toast.info("Your cart is empty");
                    navigate('/client/cart');
                }
            } catch (error) {
                console.error("Error fetching checkout data:", error);
                toast.error("Failed to load checkout details");
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [navigate]);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleUpdateQuantity = async (produitId: number, currentQty: number, change: number) => {
        const newQty = currentQty + change;
        if (newQty <= 0) return;

        try {
            const updatedPanier = await cartApi.modifierQuantite({ produitId, quantite: newQty });
            setPanier(updatedPanier);
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Failed to update quantity');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.nomComplet || !formData.telephone || !formData.adresse || !formData.ville || !formData.region || !formData.codePostal || !formData.methodePaiement) {
            toast.error("Please fill in all required fields");
            return;
        }

        setIsSubmitting(true);
        try {
            const response = await ordersApi.validerPanier(formData);
            toast.success("Payment secured. Your payment is being held in escrow until delivery is confirmed.");
            
            // Trigger automatic download
            if (response && response.id) {
                try {
                    const blob = await ordersApi.downloadFacture(response.id);
                    const url = window.URL.createObjectURL(new Blob([blob]));
                    const link = document.createElement('a');
                    link.href = url;
                    link.setAttribute('download', `facture-${response.reference || response.id}.pdf`);
                    document.body.appendChild(link);
                    link.click();
                    link.remove();
                    window.URL.revokeObjectURL(url);
                } catch (downloadError) {
                    console.error("Failed to download invoice:", downloadError);
                    toast.warning("Order placed, but invoice download failed. You can find it in your orders.");
                }
            }
            
            navigate(`/client/orders?orderId=${response.id}&escrow=held`);
        } catch (error: any) {
            toast.error(error.response?.data?.message || "Failed to place order");
        } finally {
            setIsSubmitting(false);
        }
    };

    if (isLoading) return <SoftLoader />;
    if (!panier) return null;

    return (
        <div className="container-fluid p-0">
            <div className="d-flex align-items-center mb-4">
                <SoftButton 
                    className="me-3 p-2" 
                    onClick={() => navigate('/client/cart')}
                >
                    <ChevronLeft size={20} />
                </SoftButton>
                <h4 className="fw-bold mb-0">Checkout</h4>
            </div>

            <form onSubmit={handleSubmit} className="row g-4">
                <div className="col-lg-7">
                    <SoftCard title="Shipping Information">
                        <div className="row g-3">
                            <div className="col-12">
                                <label className="form-label small fw-semibold">Full Name *</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-transparent border-end-0">
                                        <User size={18} className="text-muted" />
                                    </span>
                                    <input
                                        type="text"
                                        name="nomComplet"
                                        className="form-control border-start-0 ps-0 shadow-none border"
                                        placeholder="John Doe"
                                        value={formData.nomComplet}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label small fw-semibold">Phone Number *</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-transparent border-end-0">
                                        <Phone size={18} className="text-muted" />
                                    </span>
                                    <input
                                        type="tel"
                                        name="telephone"
                                        className="form-control border-start-0 ps-0 shadow-none border"
                                        placeholder="+212 600-000000"
                                        value={formData.telephone}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label small fw-semibold">Postal Code</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-transparent border-end-0">
                                        <MapPin size={18} className="text-muted" />
                                    </span>
                                    <input
                                        type="text"
                                        name="codePostal"
                                        className="form-control border-start-0 ps-0 shadow-none border"
                                        placeholder="20000"
                                        value={formData.codePostal}
                                        onChange={handleInputChange}
                                    />
                                </div>
                            </div>

                            <div className="col-12">
                                <label className="form-label small fw-semibold">Address *</label>
                                <div className="input-group">
                                    <span className="input-group-text bg-transparent border-end-0">
                                        <MapPin size={18} className="text-muted" />
                                    </span>
                                    <input
                                        type="text"
                                        name="adresse"
                                        className="form-control border-start-0 ps-0 shadow-none border"
                                        placeholder="123 Street Name"
                                        value={formData.adresse}
                                        onChange={handleInputChange}
                                        required
                                    />
                                </div>
                            </div>

                            <div className="col-md-6">
                                <label className="form-label small fw-semibold">City *</label>
                                <input
                                    type="text"
                                    name="ville"
                                    className="form-control shadow-none border"
                                    placeholder="Casablanca"
                                    value={formData.ville}
                                    onChange={handleInputChange}
                                    required
                                />
                            </div>

                            <div className="col-md-6">
                                <label className="form-label small fw-semibold">Region</label>
                                <input
                                    type="text"
                                    name="region"
                                    className="form-control shadow-none border"
                                    placeholder="Grand Casablanca"
                                    value={formData.region}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <h6 className="mt-4 mb-3 fw-bold">Payment Method</h6>
                        <div className="row g-3">
                            <div className="col-md-6">
                                <div 
                                    className={`p-3 rounded border cursor-pointer d-flex align-items-center gap-3 ${formData.methodePaiement === 'CARD' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, methodePaiement: 'CARD' }))}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <CreditCard className={formData.methodePaiement === 'CARD' ? 'text-primary' : 'text-muted'} />
                                    <div>
                                        <div className="fw-bold small">Card Payment</div>
                                        <div className="text-muted extra-small">Pay with credit card</div>
                                    </div>
                                </div>
                            </div>
                            <div className="col-md-6">
                                <div 
                                    className={`p-3 rounded border cursor-pointer d-flex align-items-center gap-3 ${formData.methodePaiement === 'CASH_ON_DELIVERY' ? 'border-primary bg-primary bg-opacity-10' : ''}`}
                                    onClick={() => setFormData(prev => ({ ...prev, methodePaiement: 'CASH_ON_DELIVERY' }))}
                                    style={{ cursor: 'pointer' }}
                                >
                                    <Banknote className={formData.methodePaiement === 'CASH_ON_DELIVERY' ? 'text-primary' : 'text-muted'} />
                                    <div>
                                        <div className="fw-bold small">Cash on Delivery</div>
                                        <div className="text-muted extra-small">Pay when you receive</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </SoftCard>
                </div>

                <div className="col-lg-5">
                    <SoftCard title="Order Summary">
                        <div className="mb-4" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                            {panier.lignes.map((item) => (
                                <div key={item.id} className="d-flex align-items-center gap-3 mb-3 pb-3 border-bottom last-child-no-border">
                                    <div 
                                        className="bg-body-tertiary rounded d-flex align-items-center justify-content-center overflow-hidden"
                                        style={{ width: '60px', height: '60px', flexShrink: 0 }}
                                    >
                                        {item.image ? (
                                            <img src={resolveImage(item.image) || ''} alt={item.nomProduit} className="w-100 h-100 object-fit-cover" />
                                        ) : (
                                            <ShoppingCart size={20} className="text-muted opacity-50" />
                                        )}
                                    </div>
                                    <div className="flex-grow-1 min-w-0">
                                        <div className="fw-bold text-truncate small">{item.nomProduit}</div>
                                        <div className="text-primary small fw-semibold">{item.prixUnitaire?.toFixed(2)} DH</div>
                                    </div>
                                    <div className="d-flex align-items-center gap-2">
                                        <button 
                                            type="button"
                                            className="btn btn-sm btn-light p-1 border shadow-none"
                                            onClick={() => handleUpdateQuantity(item.produitId, item.quantite, -1)}
                                        >
                                            <Minus size={12} />
                                        </button>
                                        <span className="small fw-bold" style={{ minWidth: '20px', textAlign: 'center' }}>{item.quantite}</span>
                                        <button 
                                            type="button"
                                            className="btn btn-sm btn-light p-1 border shadow-none"
                                            onClick={() => handleUpdateQuantity(item.produitId, item.quantite, 1)}
                                        >
                                            <Plus size={12} />
                                        </button>
                                    </div>
                                    <div className="text-end fw-bold small" style={{ minWidth: '80px' }}>
                                        {(item.sousTotal || (item.quantite * (item.prixUnitaire || 0))).toFixed(2)} DH
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="d-flex justify-content-between mb-2 small text-muted">
                            <span>Subtotal</span>
                            <span>{panier.montantTotal.toFixed(2)} DH</span>
                        </div>
                        <div className="d-flex justify-content-between mb-2 small text-muted">
                            <span>Delivery</span>
                            <span>0.00 DH</span>
                        </div>
                        <hr />
                        <div className="d-flex justify-content-between mb-4">
                            <span className="fw-bold">Total</span>
                            <span className="fw-bold text-primary fs-5">{panier.montantTotal.toFixed(2)} DH</span>
                        </div>

                        <div className="p-3 rounded-4 mb-4 border bg-primary bg-opacity-10 border-primary-subtle">
                            <div className="d-flex gap-3 align-items-start">
                                <div className="bg-white rounded-circle p-2 text-primary shadow-sm">
                                    <ShieldCheck size={18} />
                                </div>
                                <div>
                                    <div className="fw-bold small text-primary mb-1">Payment secured</div>
                                    <div className="text-muted small mb-0">
                                        Your payment will be held in escrow and released only after delivery is confirmed.
                                    </div>
                                </div>
                            </div>
                        </div>

                        <SoftButton
                            type="submit"
                            className="w-100 py-3"
                            isLoading={isSubmitting}
                        >
                            Payer
                        </SoftButton>
                        <p className="text-center text-muted mt-3 extra-small">
                            By clicking "Payer", you agree to our Terms of Service.
                        </p>
                    </SoftCard>
                </div>
            </form>
        </div>
    );
};
