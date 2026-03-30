import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { fournisseursApi, reviewsApi } from "../../../api/fournisseurs.api";
import {
  analyticsApi,
  SupplierAnalyticsStats,
} from "../../../api/analytics.api";
import { profilApi } from "../../../api/profil.api";
import { categoriesApi, Categorie } from "../../../api/categories.api";
import { productsApi } from "../../../api/products.api";
import { Produit } from "../../../api/types";
import { SoftSelect } from "../../../components/ui/SoftSelect";
import { SoftCard } from "../../../components/ui/SoftCard";
import { SoftButton } from "../../../components/ui/SoftButton";
import { SoftInput } from "../../../components/ui/SoftInput";
import { SoftBadge } from "../../../components/ui/SoftBadge";
import { SoftLoader } from "../../../components/ui/SoftLoader";
import {
  Truck,
  User,
  MapPin,
  ShieldCheck,
  TrendingUp,
  Package,
  Star,
  Clock,
  Save,
  Camera,
  MessageSquare,
  Plus,
} from "lucide-react";
import { toast } from "react-toastify";
import { AuthStore } from "../../auth/auth.store";
import {
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Cell,
} from "recharts";
import { formatPriceDh } from "../../../utils/price";
import { supplierProfileChartTheme } from "../../shared/supplierProfileTheme";
import { resolveImage } from "../../../utils/imageUtils";
import "../../shared/styles/supplier-profile.css";

const chartXAxisTick = {
  fill: supplierProfileChartTheme.tick,
  fontSize: 11,
  fontWeight: 500,
};
const chartYAxisTick = { fill: supplierProfileChartTheme.tick, fontSize: 11 };

export const SupplierProfilePage: React.FC = () => {
  const [profile, setProfile] = useState<any | null>(null);
  const [products, setProducts] = useState<Produit[]>([]);
  const [reviews, setReviews] = useState<any[]>([]);
  const [categories, setCategories] = useState<Categorie[]>([]);
  const [stats, setStats] = useState<SupplierAnalyticsStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [activeTab, setActiveTab] = useState<"overview" | "reviews">(
    "overview",
  );
  const [isTabsVisible, setIsTabsVisible] = useState(true);
  const lastScrollY = useRef(0);
  const [formData, setFormData] = useState({
    nom: "",
    nomEntreprise: "",
    description: "",
    telephone: "",
    adresse: "",
    infoContact: "",
    image: "",
    email: "",
    categorie: "",
    yearEstablished: 2024,
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    const mainElement = document.querySelector("main");
    if (!mainElement) return;

    const handleScroll = () => {
      const currentScrollY = mainElement.scrollTop;

      // Near top of the page, always show tabs
      if (currentScrollY < 400) {
        setIsTabsVisible(true);
      } else {
        const delta = currentScrollY - lastScrollY.current;

        // Scrolling down (even slowly): hide tabs
        if (delta > 0) {
          setIsTabsVisible(false);
        }
        // Scrolling up (beyond small threshold): show tabs
        else if (delta < -10) {
          setIsTabsVisible(true);
        }
      }

      lastScrollY.current = currentScrollY;
    };

    mainElement.addEventListener("scroll", handleScroll);
    return () => mainElement.removeEventListener("scroll", handleScroll);
  }, []);

  const loadData = async () => {
    const userId = AuthStore.getUserId();

    if (!userId) {
      console.error("No supplier ID found in auth token");
      setError(
        "Impossible de trouver l'identifiant du fournisseur. Veuillez vous reconnecter.",
      );
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const [
        profileData,
        productsData,
        reviewsData,
        categoriesData,
        statsData,
      ] = await Promise.all([
        fournisseursApi.getMe(),
        productsApi.mesProduits().catch((err) => {
          console.warn("Failed to load products", err);
          return [];
        }),
        reviewsApi.getReviews(userId).catch((err) => {
          console.warn("Failed to load reviews", err);
          return [];
        }),
        categoriesApi.getAll().catch((err) => {
          console.warn("Failed to load categories", err);
          return [];
        }),
        analyticsApi.getStats().catch((err) => {
          console.warn("Failed to load supplier stats", err);
          return null;
        }),
      ]);

      setProfile(profileData);
      setProducts(productsData);
      setReviews(reviewsData);
      setCategories(categoriesData);
      setStats(statsData);
      setFormData({
        nom: profileData.nom || "",
        nomEntreprise: profileData.nomEntreprise || "",
        description: profileData.description || "",
        telephone: profileData.telephone || "",
        adresse: profileData.adresse || "",
        infoContact: profileData.infoContact || "",
        image: profileData.image || "",
        email: profileData.email || "",
        categorie: profileData.categorie || "",
        yearEstablished: profileData.yearEstablished || 2024,
      });
    } catch (error: any) {
      console.error("Failed to load profile data", error);
      if (error.response?.status === 403) {
        setError(
          "Accès refusé. Vous n'avez pas les permissions pour voir ce profil.",
        );
      } else if (error.response?.status === 404) {
        setError(
          "Profil non trouvé. Votre compte n'est peut-être pas encore activé.",
        );
      } else {
        setError(
          error.response?.data?.message ||
            error.message ||
            "Impossible de charger le profil fournisseur. Veuillez réessayer plus tard.",
        );
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
      toast.success("Profile updated successfully");
      setEditMode(false);
      loadData();
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Failed to update profile");
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
      setFormData((prev) => ({ ...prev, image: url }));
      // Update profile view immediately
      setProfile((prev: any) => ({ ...prev, image: url }));
      toast.success("Image uploaded successfully");
    } catch (error) {
      toast.error("Failed to upload image");
    } finally {
      setIsSaving(false);
    }
  };

  const getStatusColor = (
    status: string,
  ): "success" | "warning" | "danger" | "info" | undefined => {
    switch (status) {
      case "VERIFIED":
        return "success";
      case "ACTIVE":
        return "success";
      case "PENDING_APPROVAL":
        return "warning";
      case "SUSPENDED":
        return "danger";
      case "REJECTED":
        return "danger";
      default:
        return "info";
    }
  };

  if (isLoading) return <SoftLoader />;

  if (error) {
    return (
      <div className="container-fluid py-5">
        <SoftCard className="text-center p-5">
          <div className="text-danger mb-4">
            <i
              className="bi bi-exclamation-triangle-fill"
              style={{ fontSize: "3rem" }}
            ></i>
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

  if (!profile)
    return (
      <div className="p-5 text-center">
        <div className="h4 fw-bold text-muted mb-2">Profile not found</div>
        <p className="text-muted">
          We couldn't retrieve your business profile. Please try relogging or
          contact support.
        </p>
        <SoftButton onClick={loadData} variant="outline" className="mt-3">
          Retry Loading
        </SoftButton>
      </div>
    );

  const performance = profile.performance;
  const metricsData = [
    {
      name: "On-time Delivery",
      value: performance?.onTime ?? null,
      color: "#4e73df",
    },
    {
      name: "Response Rate",
      value: performance?.response ?? null,
      color: "#1cc88a",
    },
    {
      name: "Quality Score",
      value: performance?.quality ?? null,
      color: "#f6c23e",
    },
  ];
  const chartMetrics = metricsData.filter((metric) => metric.value !== null);
  const hasPerformanceData = Boolean(
    performance?.hasEnoughData && chartMetrics.length > 0,
  );
  const formatMetricValue = (value: number | null) => {
    if (value === null) return "Not enough data";
    return `${value.toFixed(Number.isInteger(value) ? 0 : 1)}%`;
  };
  const performanceSummary =
    performance && (performance.orderCount > 0 || performance.reviewCount > 0)
      ? `${performance.orderCount} orders and ${performance.reviewCount} reviews recorded so far.`
      : "Complete deliveries, collect reviews, or respond to conversations to unlock performance analytics.";

  const totalStars = reviews.reduce((acc, r) => acc + (r.rating || 0), 0);
  const isSuperSupplier = totalStars >= 10;

  return (
    <div className="container-fluid p-0 pb-5 supplier-profile-page">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h4 className="fw-bold mb-1">Company Profile</h4>
          <p className="text-muted mb-0">
            Manage your business information and track performance
          </p>
        </div>
        <SoftButton
          variant={editMode ? "outline" : "primary"}
          className="rounded-pill px-4"
          onClick={() => setEditMode(!editMode)}
        >
          {editMode ? "Cancel" : "Edit Profile"}
        </SoftButton>
      </div>

      {/* Top Profile Card */}
      <SoftCard
        className="profile-header-card p-0 border-0 mb-4 overflow-hidden shadow-sm"
        style={{ borderRadius: "24px" }}
      >
        <div
          className="profile-header-banner"
          style={{
            height: "200px",
          }}
        >
          {/* Subtle pattern overlay */}
          <div
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              opacity: 0.1,
              backgroundImage:
                "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
              backgroundSize: "24px 24px",
            }}
          ></div>
        </div>

        <div
          className="px-4 pb-4"
          style={{ marginTop: "-70px", position: "relative", zIndex: 2 }}
        >
          <div className="d-flex flex-column flex-md-row align-items-end align-items-md-center gap-4">
            <div
              className="profile-avatar-shell bg-white p-1 shadow-sm rounded-4 position-relative"
              style={{ width: "140px", height: "140px" }}
            >
              <div className="profile-avatar-image w-100 h-100 rounded-4 bg-light d-flex align-items-center justify-content-center overflow-hidden">
                {profile.image ? (
                  <img
                    src={resolveImage(profile.image)}
                    alt={profile.nomEntreprise}
                    className="w-100 h-100 object-fit-cover"
                  />
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
                    className="profile-upload-button btn btn-primary btn-sm rounded-circle position-absolute bottom-0 end-0 p-2 shadow-lg border-white"
                    style={{ transform: "translate(25%, 25%)" }}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <Camera size={16} />
                  </button>
                </>
              )}
            </div>

            <div className="flex-grow-1 pt-md-5 mt-2 mt-md-0">
              <div className="d-flex flex-wrap align-items-center gap-3 mb-2">
                <div className="profile-title-pill d-inline-flex align-items-center px-4 py-2 rounded-4 shadow-sm border">
                  <h1
                    className="profile-title-text fw-extrabold mb-0"
                    style={{
                      fontSize: "2.1rem",
                      letterSpacing: "-1px",
                      fontWeight: 800,
                    }}
                  >
                    {profile.nomEntreprise}
                  </h1>
                </div>
                <SoftBadge
                  variant={getStatusColor(profile.status)}
                  className="d-flex align-items-center gap-1 py-1 px-3 rounded-pill shadow-sm"
                >
                  {profile.status === "VERIFIED" ? (
                    <ShieldCheck size={14} />
                  ) : (
                    <Clock size={14} />
                  )}
                  <span
                    className="text-uppercase small fw-bold"
                    style={{ letterSpacing: "0.5px" }}
                  >
                    {profile.status?.replace("_", " ") || "ACTIVE"}
                  </span>
                </SoftBadge>

                {isSuperSupplier && (
                  <div
                    className="d-inline-flex align-items-center gap-2 py-1 px-3 rounded-pill shadow-sm animate-fade-in"
                    style={{
                      background:
                        "linear-gradient(135deg, #FFD700 0%, #FFA500 100%)",
                      color: "#000",
                      fontWeight: "800",
                      fontSize: "0.75rem",
                      border: "1px solid rgba(255, 215, 0, 0.5)",
                      boxShadow: "0 4px 12px rgba(255, 215, 0, 0.2)",
                      textTransform: "uppercase",
                      letterSpacing: "0.5px",
                    }}
                  >
                    <Star size={14} fill="black" />
                    <span>Super Supplier</span>
                  </div>
                )}
              </div>

              <div className="profile-meta-row d-flex flex-wrap gap-x-4 gap-y-2 fw-medium">
                <span className="d-flex align-items-center gap-2 border-end pe-4">
                  <MapPin size={18} className="text-primary opacity-75" />
                  {profile.adresse}
                </span>
                <span className="d-flex align-items-center gap-2 border-end pe-4">
                  <div className="d-flex align-items-center text-warning">
                    <Star size={18} fill="currentColor" className="me-1" />
                    <span className="profile-rating-value fw-bold text-dark">
                      {profile.averageRating?.toFixed(1) || "0.0"}
                    </span>
                  </div>
                  <span className="small">({reviews.length} reviews)</span>
                </span>
                <span className="d-flex align-items-center gap-2">
                  <Clock size={18} className="text-primary opacity-75" />
                  Member since {profile.yearEstablished || "2022"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </SoftCard>

      {/* Section Tabs */}
      <div
        className="profile-tabs-wrap sticky-top py-3 mb-4"
        style={{
          top: "0",
          zIndex: 10,
          margin: "0 -1.5rem",
          padding: "0 1.5rem",
          transition:
            "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.3s ease-out",
          transform: isTabsVisible ? "translateY(0)" : "translateY(-100%)",
          opacity: isTabsVisible ? 1 : 0,
          pointerEvents: isTabsVisible ? "auto" : "none",
        }}
      >
        <div className="profile-tabs-nav d-flex gap-2 p-1 rounded-pill shadow-sm">
          <button
            className={`profile-tab-btn btn rounded-pill px-4 py-2 border-0 transition-all fw-bold ${activeTab === "overview" ? "active" : ""}`}
            onClick={() => setActiveTab("overview")}
          >
            Overview
          </button>
          <button
            className={`profile-tab-btn btn rounded-pill px-4 py-2 border-0 transition-all fw-bold ${activeTab === "reviews" ? "active" : ""}`}
            onClick={() => setActiveTab("reviews")}
          >
            Reviews ({reviews.length})
          </button>
        </div>
      </div>

      {activeTab === "overview" ? (
        <div className="row g-4">
          <div className="col-lg-8">
            <SoftCard
              className="profile-section-card border-0 shadow-sm mb-4"
              style={{ borderRadius: "24px" }}
            >
              {editMode ? (
                <form onSubmit={handleSave}>
                  <div className="row g-3">
                    <div className="col-md-6">
                      <SoftInput
                        label="Contact Person Name"
                        value={formData.nom}
                        onChange={(e) =>
                          setFormData({ ...formData, nom: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <SoftInput
                        label="Email Address"
                        value={formData.email}
                        onChange={(e) =>
                          setFormData({ ...formData, email: e.target.value })
                        }
                        required
                        type="email"
                      />
                    </div>
                    <div className="col-md-6">
                      <SoftInput
                        label="Company Trade Name"
                        value={formData.nomEntreprise}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            nomEntreprise: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-3">
                      <SoftSelect
                        label="Category"
                        value={formData.categorie}
                        options={categories}
                        onChange={(val) =>
                          setFormData({ ...formData, categorie: val })
                        }
                      />
                    </div>
                    <div className="col-md-3">
                      <SoftInput
                        label="Year Established"
                        value={formData.yearEstablished}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            yearEstablished: parseInt(e.target.value) || 2024,
                          })
                        }
                        type="number"
                      />
                    </div>
                    <div className="col-12">
                      <label className="form-label small fw-bold text-muted">
                        About Company / Business Description
                      </label>
                      <textarea
                        className="profile-textarea form-control border-0 bg-light rounded-4 p-3"
                        rows={4}
                        value={formData.description}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            description: e.target.value,
                          })
                        }
                        placeholder="Tell clients about your quality, history, and values..."
                      />
                    </div>
                    <div className="col-md-6">
                      <SoftInput
                        label="Business Phone"
                        value={formData.telephone}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            telephone: e.target.value,
                          })
                        }
                        required
                      />
                    </div>
                    <div className="col-md-6">
                      <SoftInput
                        label="Full Business Address"
                        value={formData.adresse}
                        onChange={(e) =>
                          setFormData({ ...formData, adresse: e.target.value })
                        }
                        required
                      />
                    </div>
                    <div className="col-12 text-end mt-4">
                      <SoftButton
                        type="submit"
                        isLoading={isSaving}
                        className="rounded-pill px-5"
                      >
                        <Save size={18} className="me-2" /> Save Changes
                      </SoftButton>
                    </div>
                  </div>
                </form>
              ) : (
                <div className="row g-4">
                  <div className="col-md-6">
                    <div className="profile-info-row p-4 bg-light rounded-4 h-100">
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
                    <div className="profile-info-row p-4 bg-light rounded-4 h-100">
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
                          <div className="fw-bold">
                            {profile.categorie || "General Supplier"}
                          </div>
                        </div>
                        <div>
                          <div className="small text-muted">
                            Year Established
                          </div>
                          <div className="fw-bold">
                            {profile.yearEstablished || "2024"}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-12">
                    <div className="profile-info-row p-4 bg-light rounded-4">
                      <div className="d-flex align-items-center gap-3 mb-3 text-primary">
                        <Package size={20} />
                        <h6 className="fw-bold mb-0">About Company</h6>
                      </div>
                      <p
                        className="text-body mb-0"
                        style={{ lineHeight: "1.7" }}
                      >
                        {profile.description ||
                          "Leading distributor and wholesale partner specialized in high-quality consumer goods. We focus on reliability, competitive pricing, and sustainable supply chains."}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </SoftCard>

            <div className="row g-4">
              <div className="col-12">
                <SoftCard
                  className="profile-section-card border-0 shadow-sm"
                  style={{ borderRadius: "24px" }}
                >
                  <div className="d-flex justify-content-between align-items-center mb-4">
                    <div className="d-flex align-items-center gap-3">
                      <div className="profile-section-icon profile-section-icon-warning">
                        <Package size={24} />
                      </div>
                      <h5 className="fw-bold mb-0">Supplier Catalog</h5>
                    </div>
                    <Link
                      to="/supplier/products"
                      className="profile-link-btn btn btn-link text-primary p-0 fw-bold"
                    >
                      View Catalog
                    </Link>
                  </div>
                  <div className="row g-3">
                    {products.slice(0, 6).map((product) => (
                      <div className="col-sm-6 col-md-4" key={product.id}>
                        <div className="profile-catalog-card p-2 border rounded-4 hover-translate-y transition-all">
                          <div
                            className="profile-catalog-image bg-light rounded-3 overflow-hidden mb-2"
                            style={{ height: "100px" }}
                          >
                            <img
                              src={resolveImage(product.image) || ""}
                              alt={product.nom}
                              className="w-100 h-100 object-fit-cover"
                            />
                          </div>
                          <h6 className="small fw-bold mb-1 text-truncate">
                            {product.nom}
                          </h6>
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="text-primary fw-bold small">
                              {formatPriceDh(product.prixUnitaire)}
                            </span>
                            <Link
                              to="/supplier/products"
                              className="profile-catalog-action btn btn-sm btn-light rounded-circle p-1"
                            >
                              <Plus size={14} />
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                    {products.length === 0 && (
                      <div className="col-12">
                        <div className="profile-empty-panel text-center py-4 text-muted bg-light rounded-4">
                          No catalog products available yet.
                        </div>
                      </div>
                    )}
                  </div>
                </SoftCard>
              </div>
              <div className="col-12">
                <SoftCard
                  title="Marketplace Statistics"
                  className="profile-section-card border-0 shadow-sm h-100"
                  style={{ borderRadius: "24px" }}
                >
                  <div className="row g-2">
                    <div className="col-3">
                      <div className="profile-stat-tile p-3 bg-light rounded-4 text-center">
                        <div className="h4 fw-bold mb-0 text-primary">
                          {stats?.nombreCommandes ??
                            performance?.orderCount ??
                            0}
                        </div>
                        <div className="small text-muted">Orders</div>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="profile-stat-tile p-3 bg-light rounded-4 text-center">
                        <div className="h4 fw-bold mb-0 text-success">
                          {stats?.nombreClients ?? 0}
                        </div>
                        <div className="small text-muted">Customers</div>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="profile-stat-tile p-3 bg-light rounded-4 text-center">
                        <div className="h4 fw-bold mb-0 text-info">
                          {performance?.reviewCount ?? reviews.length}
                        </div>
                        <div className="small text-muted">Reviews</div>
                      </div>
                    </div>
                    <div className="col-3">
                      <div className="profile-stat-tile p-3 bg-light rounded-4 text-center">
                        <div className="h4 fw-bold mb-0 text-warning">
                          {profile.averageRating?.toFixed(1) || "0.0"}
                        </div>
                        <div className="small text-muted">Avg Rating</div>
                      </div>
                    </div>
                  </div>
                </SoftCard>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <SoftCard
              className="profile-section-card border-0 shadow-sm mb-4"
              style={{ borderRadius: "24px" }}
            >
              <div className="d-flex align-items-center justify-content-between mb-4">
                <div className="d-flex align-items-center gap-3">
                  <div className="profile-section-icon profile-section-icon-primary">
                    <TrendingUp size={24} />
                  </div>
                  <h5 className="fw-bold mb-0 text-dark">
                    Performance Analytics
                  </h5>
                </div>
                <SoftBadge
                  variant={hasPerformanceData ? "info" : "warning"}
                  className="rounded-pill px-3 py-1"
                >
                  {hasPerformanceData ? "Live Data" : "Not enough data"}
                </SoftBadge>
              </div>

              {hasPerformanceData ? (
                <div style={{ height: "240px", width: "100%" }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={chartMetrics}
                      margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                    >
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke={supplierProfileChartTheme.grid}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={chartXAxisTick}
                      />
                      <YAxis
                        domain={[0, 100]}
                        axisLine={false}
                        tickLine={false}
                        tick={chartYAxisTick}
                      />
                      <Tooltip
                        cursor={{ fill: supplierProfileChartTheme.cursor }}
                        contentStyle={
                          supplierProfileChartTheme.tooltipContentStyle
                        }
                        labelStyle={supplierProfileChartTheme.tooltipLabelStyle}
                        itemStyle={supplierProfileChartTheme.tooltipItemStyle}
                      />
                      <Bar dataKey="value" radius={[8, 8, 0, 0]} barSize={45}>
                        {chartMetrics.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={entry.color}
                            fillOpacity={0.8}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div
                  className="profile-chart-empty d-flex flex-column align-items-center justify-content-center text-center bg-light rounded-4 px-4"
                  style={{ height: "240px" }}
                >
                  <TrendingUp
                    size={32}
                    className="text-muted mb-3 opacity-50"
                  />
                  <h6 className="fw-bold mb-2">
                    No performance data available yet
                  </h6>
                  <p
                    className="text-muted small mb-0"
                    style={{ maxWidth: "260px" }}
                  >
                    {performanceSummary}
                  </p>
                </div>
              )}

              <div className="d-flex flex-column gap-3 mt-4">
                {metricsData.map((m) => (
                  <div
                    key={m.name}
                    className="profile-metric-card p-3 bg-white border border-light rounded-4 shadow-sm hover-translate-y transition-all"
                  >
                    <div className="d-flex justify-content-between align-items-center mb-2">
                      <div className="d-flex align-items-center gap-2">
                        <div
                          style={{
                            width: "8px",
                            height: "8px",
                            borderRadius: "50%",
                            backgroundColor: m.color,
                          }}
                        ></div>
                        <span
                          className="small text-muted fw-bold text-uppercase"
                          style={{ letterSpacing: "0.5px", fontSize: "10px" }}
                        >
                          {m.name}
                        </span>
                      </div>
                      <span
                        className="fw-bold"
                        style={{
                          color: m.value === null ? "#64748b" : m.color,
                        }}
                      >
                        {formatMetricValue(m.value)}
                      </span>
                    </div>
                    {m.value === null ? (
                      <div className="small text-muted">
                        Not enough real activity to score this metric yet.
                      </div>
                    ) : (
                      <div
                        className="profile-metric-track bg-light rounded-pill overflow-hidden"
                        style={{ height: "6px" }}
                      >
                        <div
                          className="h-100 transition-all duration-1000 ease-out"
                          style={{
                            width: `${m.value}%`,
                            backgroundColor: m.color,
                            boxShadow: `0 0 10px ${m.color}40`,
                          }}
                        />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </SoftCard>

            <SoftCard
              className="profile-section-card border-0 shadow-sm"
              style={{ borderRadius: "24px" }}
            >
              <div className="d-flex align-items-center gap-3 mb-4">
                <div className="profile-section-icon profile-section-icon-primary">
                  <Star size={24} />
                </div>
                <h5 className="fw-bold mb-0">Marketplace Rating</h5>
              </div>
              <div className="text-center py-3">
                <div className="display-4 fw-bold mb-1">
                  {profile.averageRating?.toFixed(1) || "0.0"}
                </div>
                <div className="d-flex justify-content-center gap-1 text-warning mb-3">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <Star
                      key={s}
                      size={20}
                      fill={
                        s <= Math.round(profile.averageRating || 0)
                          ? "currentColor"
                          : "none"
                      }
                    />
                  ))}
                </div>
                <hr className="my-4 opacity-10" />
                <div className="d-flex justify-content-around">
                  <div>
                    <div className="fw-bold">{reviews.length}</div>
                    <div className="text-muted small">Reviews</div>
                  </div>
                  <div className="profile-divider"></div>
                  <div>
                    <div className="fw-bold">
                      {profile.averageRating?.toFixed(1) || "0.0"}
                    </div>
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
              {reviews.map((review) => (
                <SoftCard
                  key={review.id}
                  className="profile-review-card border-0 shadow-sm p-4"
                  style={{ borderRadius: "24px" }}
                >
                  <div className="d-flex justify-content-between align-items-start mb-3">
                    <div className="d-flex align-items-center gap-3">
                      <div
                        className="profile-review-avatar bg-light p-3 rounded-circle text-primary fw-bold d-flex align-items-center justify-content-center shadow-sm"
                        style={{ width: "48px", height: "48px" }}
                      >
                        {review.clientName?.charAt(0) || "C"}
                      </div>
                      <div>
                        <h6 className="fw-bold mb-0">{review.clientName}</h6>
                        <div className="text-muted small">
                          {new Date(review.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                    <div className="d-flex gap-1 text-warning">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star
                          key={s}
                          size={14}
                          fill={s <= review.rating ? "currentColor" : "none"}
                        />
                      ))}
                    </div>
                  </div>
                  <p className="text-muted mb-0" style={{ lineHeight: "1.6" }}>
                    {review.comment}
                  </p>
                </SoftCard>
              ))}
              {reviews.length === 0 && (
                <div className="profile-empty-state text-center py-5 bg-white rounded-4 border-dashed border-2 opacity-50">
                  <MessageSquare
                    size={48}
                    className="text-muted mb-3 opacity-20"
                  />
                  <p className="text-muted">
                    No reviews yet from marketplace clients.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
