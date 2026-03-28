import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ShieldCheck, Package, Truck, BarChart3,
    MessageSquare, CheckCircle, ArrowRight, ChevronDown,
    Building2, Users, ShoppingCart, Globe, TrendingUp,
    Award, Zap, Lock, MapPin, Menu, X, Star,
    ShoppingBag, Search, Bell, Settings, LayoutDashboard,
    Boxes, ClipboardList, UserCheck
} from 'lucide-react';
import appLogo from '../../assets/app-logo.png';
import './LandingPage.css';

/* ============================================================
   DATA
   ============================================================ */

const CATEGORIES = [
    {
        emoji: '🛒',
        name: 'Épicerie',
        desc: "Produits secs, conserves et essentiels de l'épicerie quotidienne.",
        count: '240+ produits',
        bg: 'linear-gradient(135deg, #d1fae5, #a7f3d0)',
    },
    {
        emoji: '🥤',
        name: 'Boissons',
        desc: 'Eaux, jus, sodas et boissons professionnelles en gros.',
        count: '180+ produits',
        bg: 'linear-gradient(135deg, #dbeafe, #bfdbfe)',
    },
    {
        emoji: '🥛',
        name: 'Produits laitiers',
        desc: 'Lait, fromages, yaourts et dérivés laitiers frais.',
        count: '130+ produits',
        bg: 'linear-gradient(135deg, #e0f2fe, #bae6fd)',
    },
    {
        emoji: '🫒',
        name: 'Huiles & Olives',
        desc: 'Huiles végétales, olives et condiments de qualité.',
        count: '90+ produits',
        bg: 'linear-gradient(135deg, #d9f99d, #bbf7d0)',
    },
    {
        emoji: '🧹',
        name: 'Produits de Nettoyage',
        desc: "Détergents, désinfectants et produits d'entretien professionnel.",
        count: '160+ produits',
        bg: 'linear-gradient(135deg, #ede9fe, #ddd6fe)',
    },
    {
        emoji: '🧴',
        name: 'Hygiène Corporelle',
        desc: "Soins du corps, savons et produits d'hygiène personnelle.",
        count: '200+ produits',
        bg: 'linear-gradient(135deg, #fce7f3, #fbcfe8)',
    },
    {
        emoji: '📦',
        name: 'Papier & Fournitures',
        desc: 'Papier, emballages et fournitures de bureau en gros.',
        count: '110+ produits',
        bg: 'linear-gradient(135deg, #fef9c3, #fde68a)',
    },
    {
        emoji: '⚡',
        name: 'Électronique',
        desc: 'Accessoires, câbles et petits équipements électroniques.',
        count: '75+ produits',
        bg: 'linear-gradient(135deg, #e0e7ff, #c7d2fe)',
    },
    {
        emoji: '☕',
        name: 'Thé Café & Infusions',
        desc: 'Cafés, thés, tisanes et boissons chaudes de qualité.',
        count: '95+ produits',
        bg: 'linear-gradient(135deg, #fef3c7, #fde68a)',
    },
];

const SUPPLIERS = [
    {
        initials: 'AB',
        name: 'Distribution Al Baraka',
        desc: 'Épicerie générale & produits secs',
        location: 'Casablanca',
        gradient: 'linear-gradient(135deg, #5b73e8, #879df5)',
    },
    {
        initials: 'AT',
        name: 'Atlas Boissons Pro',
        desc: 'Boissons & eaux minérales',
        location: 'Marrakech',
        gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
    },
    {
        initials: 'LN',
        name: 'Laiterie du Nord',
        desc: 'Produits laitiers & dérivés frais',
        location: 'Tanger',
        gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    },
    {
        initials: 'SE',
        name: 'Sahara Épicerie',
        desc: 'Épicerie fine & produits régionaux',
        location: 'Agadir',
        gradient: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
    },
];

const FEATURES = [
    {
        icon: <ShieldCheck size={24} />,
        bg: 'rgba(91, 115, 232, 0.1)',
        color: '#5b73e8',
        title: 'Fournisseurs Vérifiés',
        desc: "Travaillez avec des profils d'entreprises certifiés et des informations fournisseurs transparentes.",
    },
    {
        icon: <Search size={24} />,
        bg: 'rgba(16, 185, 129, 0.1)',
        color: '#10b981',
        title: 'Découverte Intelligente',
        desc: 'Naviguez dans les catégories et trouvez des produits plus vite grâce à une navigation structurée.',
    },
    {
        icon: <Lock size={24} />,
        bg: 'rgba(168, 85, 247, 0.1)',
        color: '#a855f7',
        title: 'Commandes Sécurisées',
        desc: 'Passez vos commandes en toute confiance avec des flux de commande et de paiement protégés.',
    },
    {
        icon: <Truck size={24} />,
        bg: 'rgba(245, 158, 11, 0.1)',
        color: '#f59e0b',
        title: 'Logistique & Suivi',
        desc: "Suivez la progression des commandes, le statut de livraison et les mises à jour d'expédition.",
    },
    {
        icon: <BarChart3 size={24} />,
        bg: 'rgba(59, 130, 246, 0.1)',
        color: '#3b82f6',
        title: 'Tableaux de Bord',
        desc: 'Accédez aux dashboards client, fournisseur et admin conçus pour la visibilité opérationnelle.',
    },
    {
        icon: <MessageSquare size={24} />,
        bg: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        title: 'Litiges & Remboursements',
        desc: 'Gérez les problèmes via des workflows structurés de remboursement et de résolution de litiges.',
    },
];

const WHY_ITEMS = [
    {
        icon: <UserCheck size={20} />,
        bg: 'rgba(91, 115, 232, 0.1)',
        color: '#5b73e8',
        title: "Relations d'affaires de confiance",
        desc: "Chaque fournisseur est vérifié avant d'accéder à la plateforme. Vous traitez uniquement avec des partenaires fiables.",
    },
    {
        icon: <Boxes size={20} />,
        bg: 'rgba(16, 185, 129, 0.1)',
        color: '#10b981',
        title: 'Approvisionnement centralisé',
        desc: 'Gérez tous vos fournisseurs, produits et commandes depuis un seul tableau de bord unifié.',
    },
    {
        icon: <ClipboardList size={20} />,
        bg: 'rgba(168, 85, 247, 0.1)',
        color: '#a855f7',
        title: 'Cycle de commande transparent',
        desc: "Visibilité complète sur chaque commande, de la création à la livraison, sans zone d'ombre.",
    },
    {
        icon: <ShieldCheck size={20} />,
        bg: 'rgba(245, 158, 11, 0.1)',
        color: '#f59e0b',
        title: 'Flux opérationnel sécurisé',
        desc: 'Paiements protégés, données sécurisées et politique de remboursements claire pour chaque transaction.',
    },
    {
        icon: <Globe size={20} />,
        bg: 'rgba(59, 130, 246, 0.1)',
        color: '#3b82f6',
        title: 'Gestion fournisseur évolutive',
        desc: "Scalable depuis les petits détaillants jusqu'aux grandes chaînes avec des outils qui grandissent avec vous.",
    },
    {
        icon: <TrendingUp size={20} />,
        bg: 'rgba(239, 68, 68, 0.1)',
        color: '#ef4444',
        title: 'Visibilité analytique',
        desc: 'Des tableaux de bord riches en données pour comprendre vos achats, revenus et performances.',
    },
];

const TESTIMONIALS = [
    {
        text: "Smart Supply a complètement transformé notre processus d'approvisionnement. En quelques clics, je trouve des fournisseurs certifiés et je place des commandes sans friction. Le suivi de livraison en temps réel est un vrai plus pour notre équipe.",
        name: 'Karim Bensaïd',
        role: 'Responsable achats — Chaîne de distribution, Casablanca',
        initials: 'KB',
        gradient: 'linear-gradient(135deg, #5b73e8, #879df5)',
    },
    {
        text: "Depuis que nous avons rejoint Smart Supply en tant que fournisseur, notre volume de commandes a significativement augmenté. La plateforme est simple, professionnelle, et nos clients apprécient la transparence du suivi de leurs commandes.",
        name: 'Fatima Alaoui',
        role: 'Directrice commerciale — Atlas Boissons Pro, Marrakech',
        initials: 'FA',
        gradient: 'linear-gradient(135deg, #10b981, #34d399)',
    },
    {
        text: "La gestion des litiges et remboursements était notre principale crainte avant d'adopter une plateforme digitale. Smart Supply a un workflow clair et efficace. Nous n'avons plus de disputes non résolues depuis des mois.",
        name: 'Youssef El Amrani',
        role: 'Gérant — Épicerie Centrale, Rabat',
        initials: 'YE',
        gradient: 'linear-gradient(135deg, #a855f7, #7c3aed)',
    },
];

const FAQS = [
    {
        q: "Qu'est-ce que Smart Supply ?",
        a: "Smart Supply est une plateforme B2B qui connecte les acheteurs professionnels avec des fournisseurs vérifiés. Elle centralise la découverte de produits, la gestion des commandes, le suivi de livraison et la communication entre les parties.",
    },
    {
        q: 'Qui peut rejoindre en tant que fournisseur ?',
        a: "Toute entreprise légalement constituée souhaitant distribuer ses produits à des clients professionnels peut rejoindre Smart Supply. Les fournisseurs passent par un processus de vérification avant d'être actifs sur la plateforme.",
    },
    {
        q: 'Comment fonctionnent les commandes ?',
        a: "Les clients parcourent les catégories, ajoutent des produits au panier depuis le catalogue d'un fournisseur et passent commande. Le fournisseur reçoit la commande, la confirme et organise la livraison. Toutes les étapes sont visibles en temps réel.",
    },
    {
        q: 'Comment les paiements sont-ils gérés ?',
        a: 'Smart Supply intègre des flux de paiement sécurisés avec protection des transactions. Les détails de paiement sont négociés entre client et fournisseur avec traçabilité complète dans la plateforme.',
    },
    {
        q: 'Puis-je suivre mes livraisons ?',
        a: "Oui. Chaque commande dispose d'un statut mis à jour en temps réel : en attente, confirmée, en préparation, expédiée, livrée. Vous êtes notifié à chaque changement d'état.",
    },
    {
        q: 'Comment fonctionnent les remboursements et litiges ?',
        a: 'Smart Supply intègre un workflow structuré de litiges. Le client ouvre un litige, fournit les détails, et la résolution est suivie dans la plateforme avec communication bidirectionnelle. Les admins peuvent intervenir si nécessaire.',
    },
];

/* ============================================================
   CLIENT STEPS / SUPPLIER STEPS
   ============================================================ */
const CLIENT_STEPS = [
    {
        icon: <Search size={22} />,
        bg: 'rgba(91, 115, 232, 0.12)',
        color: '#5b73e8',
        title: 'Explorer les fournisseurs',
        desc: 'Parcourez les profils vérifiés et choisissez vos partenaires de confiance.',
    },
    {
        icon: <ShoppingBag size={22} />,
        bg: 'rgba(16, 185, 129, 0.12)',
        color: '#10b981',
        title: 'Parcourir les produits',
        desc: 'Naviguez dans les catégories et le catalogue détaillé de chaque fournisseur.',
    },
    {
        icon: <ShoppingCart size={22} />,
        bg: 'rgba(168, 85, 247, 0.12)',
        color: '#a855f7',
        title: 'Passer commande',
        desc: 'Ajoutez au panier et finalisez votre commande en toute sécurité.',
    },
    {
        icon: <Truck size={22} />,
        bg: 'rgba(245, 158, 11, 0.12)',
        color: '#f59e0b',
        title: 'Suivre les livraisons',
        desc: "Suivez chaque étape depuis la confirmation jusqu'à la livraison.",
    },
];

const SUPPLIER_STEPS = [
    {
        icon: <Building2 size={22} />,
        bg: 'rgba(91, 115, 232, 0.12)',
        color: '#5b73e8',
        title: 'Créer votre profil',
        desc: "Configurez votre profil d'entreprise professionnel et vérifiez votre compte.",
    },
    {
        icon: <Package size={22} />,
        bg: 'rgba(16, 185, 129, 0.12)',
        color: '#10b981',
        title: 'Publier vos produits',
        desc: 'Ajoutez votre catalogue avec descriptions, prix et images.',
    },
    {
        icon: <ClipboardList size={22} />,
        bg: 'rgba(168, 85, 247, 0.12)',
        color: '#a855f7',
        title: 'Gérer les commandes',
        desc: 'Recevez et traitez vos commandes depuis votre tableau de bord.',
    },
    {
        icon: <TrendingUp size={22} />,
        bg: 'rgba(245, 158, 11, 0.12)',
        color: '#f59e0b',
        title: 'Grandir avec les insights',
        desc: 'Analysez vos performances, revenus et clients engagés.',
    },
];

/* ============================================================
   PREVIEW SCREENS CONFIG
   ============================================================ */
const PREVIEW_SCREENS = [
    {
        label: 'Client Dashboard',
        url: 'smart-supply.com/client/dashboard',
        title: 'Tableau de bord Client',
        navItems: ['Dashboard', 'Catégories', 'Commandes', 'Fournisseurs', 'Favoris'],
        activeNav: 0,
        metrics: [
            { label: 'Commandes totales', value: '48', trend: '+12%' },
            { label: 'Fournisseurs actifs', value: '9', trend: '+3' },
            { label: 'Dépenses ce mois', value: '14 820 MAD', trend: '+8%' },
            { label: 'En attente', value: '3', trend: '' },
        ],
        chartBars: [35, 55, 40, 70, 60, 80, 65, 90, 75, 85, 72, 95],
    },
    {
        label: 'Supplier Dashboard',
        url: 'smart-supply.com/supplier/dashboard',
        title: 'Tableau de bord Fournisseur',
        navItems: ['Dashboard', 'Mes produits', 'Commandes', 'Clients', 'Profil'],
        activeNav: 0,
        metrics: [
            { label: 'Commandes reçues', value: '127', trend: '+18%' },
            { label: 'Clients actifs', value: '34', trend: '+7' },
            { label: 'Revenu du mois', value: '38 500 MAD', trend: '+22%' },
            { label: 'Produits listés', value: '56', trend: '' },
        ],
        chartBars: [50, 65, 55, 80, 70, 90, 75, 95, 85, 100, 88, 105],
    },
    {
        label: 'Order Management',
        url: 'smart-supply.com/client/orders',
        title: 'Gestion des Commandes',
        navItems: ['Dashboard', 'Commandes', 'Panier', 'Fournisseurs', 'Paramètres'],
        activeNav: 1,
        metrics: [
            { label: 'Livrées', value: '41', trend: '' },
            { label: 'En cours', value: '5', trend: '' },
            { label: 'En attente', value: '2', trend: '' },
            { label: 'Litiges ouverts', value: '0', trend: '' },
        ],
        chartBars: [80, 70, 85, 75, 90, 80, 95, 85, 88, 92, 87, 94],
    },
    {
        label: 'Admin Controls',
        url: 'smart-supply.com/admin/dashboard',
        title: 'Panneau Administrateur',
        navItems: ['Dashboard', 'Clients', 'Fournisseurs', 'Commandes', 'Litiges'],
        activeNav: 0,
        metrics: [
            { label: 'Utilisateurs totaux', value: '312', trend: '+28' },
            { label: 'Fournisseurs vérifiés', value: '47', trend: '+6' },
            { label: 'Commandes ce mois', value: '890', trend: '+34%' },
            { label: 'Litiges en cours', value: '4', trend: '' },
        ],
        chartBars: [60, 75, 65, 85, 72, 92, 80, 98, 85, 100, 90, 108],
    },
    {
        label: 'Supplier Profiles',
        url: 'smart-supply.com/client/suppliers',
        title: 'Profils Fournisseurs',
        navItems: ['Dashboard', 'Fournisseurs', 'Catalogue', 'Engagés', 'Favoris'],
        activeNav: 1,
        metrics: [
            { label: 'Fournisseurs listés', value: '47', trend: '+6' },
            { label: 'Vérifiés', value: '47', trend: '100%' },
            { label: 'Catégories', value: '9', trend: '' },
            { label: 'Produits totaux', value: '1 280', trend: '+145' },
        ],
        chartBars: [45, 60, 50, 70, 58, 75, 65, 80, 72, 85, 78, 90],
    },
];

/* ============================================================
   SUB-COMPONENTS
   ============================================================ */

/* --- Navigation --- */
const LandingNav: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 32);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    const scrollTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        setMobileOpen(false);
    };

    return (
        <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
            <div className="lp-nav-inner">
                <Link to="/" className="lp-nav-logo">
                    <img src={appLogo} alt="Smart Supply" />
                    <span className="lp-nav-logo-text">Smart Supply</span>
                </Link>

                <ul className="lp-nav-links">
                    <li><a href="#features" onClick={e => { e.preventDefault(); scrollTo('features'); }}>Fonctionnalités</a></li>
                    <li><a href="#how-it-works" onClick={e => { e.preventDefault(); scrollTo('how-it-works'); }}>Comment ça marche</a></li>
                    <li><a href="#categories" onClick={e => { e.preventDefault(); scrollTo('categories'); }}>Catégories</a></li>
                    <li><a href="#for-clients" onClick={e => { e.preventDefault(); scrollTo('for-clients'); }}>Pour les Clients</a></li>
                    <li><a href="#for-suppliers" onClick={e => { e.preventDefault(); scrollTo('for-clients'); }}>Pour les Fournisseurs</a></li>
                    <li><a href="#footer" onClick={e => { e.preventDefault(); scrollTo('footer'); }}>Contact</a></li>
                </ul>

                <div className="lp-nav-actions">
                    <Link to="/login" className="lp-btn-ghost">Se connecter</Link>
                    <Link to="/register" className="lp-btn-primary">Commencer</Link>
                </div>

                <button
                    className="lp-nav-menu-btn"
                    onClick={() => setMobileOpen(v => !v)}
                    aria-label="Menu"
                >
                    {mobileOpen ? <X size={18} /> : <Menu size={18} />}
                </button>
            </div>

            <div className={`lp-nav-mobile${mobileOpen ? ' open' : ''}`}>
                <a href="#features" onClick={e => { e.preventDefault(); scrollTo('features'); }}>Fonctionnalités</a>
                <a href="#how-it-works" onClick={e => { e.preventDefault(); scrollTo('how-it-works'); }}>Comment ça marche</a>
                <a href="#categories" onClick={e => { e.preventDefault(); scrollTo('categories'); }}>Catégories</a>
                <a href="#for-clients" onClick={e => { e.preventDefault(); scrollTo('for-clients'); }}>Pour les Clients</a>
                <a href="#for-clients" onClick={e => { e.preventDefault(); scrollTo('for-clients'); }}>Pour les Fournisseurs</a>
                <div className="lp-nav-mobile-actions">
                    <Link to="/login" className="lp-btn-ghost" onClick={() => setMobileOpen(false)}>Se connecter</Link>
                    <Link to="/register" className="lp-btn-primary" onClick={() => setMobileOpen(false)}>Commencer</Link>
                </div>
            </div>
        </nav>
    );
};

/* --- Hero Section --- */
const HeroSection: React.FC = () => (
    <section className="lp-hero" id="home">
        <div className="lp-hero-bg">
            <div className="lp-hero-orb lp-hero-orb-1" />
            <div className="lp-hero-orb lp-hero-orb-2" />
            <div className="lp-hero-orb lp-hero-orb-3" />
        </div>

        <div className="lp-container">
            <div className="lp-hero-inner">
                {/* Left: Copy */}
                <div>
                    <div className="lp-hero-eyebrow">
                        <span className="lp-hero-eyebrow-dot" />
                        Plateforme B2B de référence
                    </div>

                    <h1 className="lp-hero-headline">
                        Smart Supply —{' '}
                        <span className="lp-hero-headline-gradient">
                            Un sourcing plus intelligent
                        </span>{' '}
                        pour les entreprises modernes
                    </h1>

                    <p className="lp-hero-subheadline">
                        Connectez-vous avec des fournisseurs certifiés, découvrez des produits par catégorie, passez des commandes en toute sécurité et gérez votre activité avec clarté depuis une seule plateforme unifiée.
                    </p>

                    <div className="lp-hero-ctas">
                        <Link to="/register" className="lp-btn-primary lp-btn-primary-lg">
                            Commencer gratuitement <ArrowRight size={18} />
                        </Link>
                        <Link to="/login" className="lp-btn-outline-lg">
                            Explorer les fournisseurs
                        </Link>
                    </div>

                    <div className="lp-hero-stats">
                        <div className="lp-hero-stat">
                            <div className="lp-hero-stat-value">1 200+</div>
                            <div className="lp-hero-stat-label">Produits référencés</div>
                        </div>
                        <div className="lp-hero-stat-divider" />
                        <div className="lp-hero-stat">
                            <div className="lp-hero-stat-value">47</div>
                            <div className="lp-hero-stat-label">Fournisseurs vérifiés</div>
                        </div>
                        <div className="lp-hero-stat-divider" />
                        <div className="lp-hero-stat">
                            <div className="lp-hero-stat-value">9</div>
                            <div className="lp-hero-stat-label">Catégories couvertes</div>
                        </div>
                    </div>
                </div>

                {/* Right: Mock App UI */}
                <div className="lp-hero-visual">
                    <div className="lp-hero-mockup">
                        {/* Floating card 1 */}
                        <div className="lp-hero-float-card lp-hero-float-1">
                            <div className="lp-float-card-icon">
                                <ShieldCheck size={16} />
                            </div>
                            <div className="lp-float-card-value">47 vérifiés</div>
                            <div className="lp-float-card-label">Fournisseurs certifiés</div>
                        </div>

                        {/* Main mock dashboard */}
                        <div className="lp-mock-main">
                            <div className="lp-mock-header">
                                <div className="lp-mock-header-dot" />
                                <div className="lp-mock-header-dot" />
                                <div className="lp-mock-header-dot" />
                                <span className="lp-mock-header-title">Smart Supply — Tableau de bord</span>
                            </div>
                            <div className="lp-mock-body">
                                <div className="lp-mock-stats-row">
                                    <div className="lp-mock-stat-card">
                                        <div className="lp-mock-stat-label">Commandes</div>
                                        <div className="lp-mock-stat-value">48</div>
                                        <div className="lp-mock-stat-trend">+12%</div>
                                    </div>
                                    <div className="lp-mock-stat-card">
                                        <div className="lp-mock-stat-label">Fournisseurs</div>
                                        <div className="lp-mock-stat-value">9</div>
                                        <div className="lp-mock-stat-trend">actifs</div>
                                    </div>
                                    <div className="lp-mock-stat-card">
                                        <div className="lp-mock-stat-label">Dépenses</div>
                                        <div className="lp-mock-stat-value" style={{ fontSize: '0.8rem' }}>14 820</div>
                                        <div className="lp-mock-stat-trend">MAD ce mois</div>
                                    </div>
                                </div>

                                <div className="lp-mock-orders">
                                    <div className="lp-mock-order-row">
                                        <div className="lp-mock-order-icon" style={{ background: 'rgba(91,115,232,0.12)' }}>📦</div>
                                        <div className="lp-mock-order-info">
                                            <div className="lp-mock-order-name">Distribution Al Baraka</div>
                                            <div className="lp-mock-order-date">Aujourd'hui, 09:14</div>
                                        </div>
                                        <div className="lp-mock-order-badge lp-badge-processing">En cours</div>
                                    </div>
                                    <div className="lp-mock-order-row">
                                        <div className="lp-mock-order-icon" style={{ background: 'rgba(16,185,129,0.12)' }}>🥤</div>
                                        <div className="lp-mock-order-info">
                                            <div className="lp-mock-order-name">Atlas Boissons Pro</div>
                                            <div className="lp-mock-order-date">Hier, 14:30</div>
                                        </div>
                                        <div className="lp-mock-order-badge lp-badge-delivered">Livré</div>
                                    </div>
                                    <div className="lp-mock-order-row">
                                        <div className="lp-mock-order-icon" style={{ background: 'rgba(245,158,11,0.12)' }}>🥛</div>
                                        <div className="lp-mock-order-info">
                                            <div className="lp-mock-order-name">Laiterie du Nord</div>
                                            <div className="lp-mock-order-date">24 Jan, 11:00</div>
                                        </div>
                                        <div className="lp-mock-order-badge lp-badge-pending">En attente</div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Floating card 2 */}
                        <div className="lp-hero-float-card lp-hero-float-2">
                            <div className="lp-float-card-icon" style={{ background: 'rgba(16,185,129,0.1)', color: '#10b981' }}>
                                <TrendingUp size={16} />
                            </div>
                            <div className="lp-float-card-value" style={{ color: '#10b981' }}>+22%</div>
                            <div className="lp-float-card-label">Revenu ce mois</div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </section>
);

/* --- Trust Strip --- */
const TrustStrip: React.FC = () => (
    <section className="lp-trust">
        <div className="lp-container">
            <div className="lp-trust-inner">
                {[
                    { icon: <ShieldCheck size={16} />, label: 'Fournisseurs Vérifiés' },
                    { icon: <Lock size={16} />, label: 'Paiements Sécurisés' },
                    { icon: <Truck size={16} />, label: 'Suivi de Livraison' },
                    { icon: <Award size={16} />, label: 'Protection Escrow' },
                    { icon: <Zap size={16} />, label: 'Workflows Métier Prêts' },
                ].map((item, i) => (
                    <div key={i} className="lp-trust-item">
                        <div className="lp-trust-icon">{item.icon}</div>
                        <span>{item.label}</span>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

/* --- Features Section --- */
const FeaturesSection: React.FC = () => (
    <section className="lp-section lp-features-bg" id="features">
        <div className="lp-container">
            <div className="lp-section-header">
                <div className="lp-section-badge"><Zap size={12} /> Fonctionnalités</div>
                <h2 className="lp-section-title">Tout ce dont votre entreprise a besoin</h2>
                <p className="lp-section-subtitle">
                    Des outils métier complets pour simplifier l'approvisionnement, gérer les commandes et renforcer vos relations fournisseurs.
                </p>
            </div>
            <div className="lp-features-grid">
                {FEATURES.map((f, i) => (
                    <div key={i} className="lp-feature-card">
                        <div className="lp-feature-icon" style={{ background: f.bg, color: f.color }}>
                            {f.icon}
                        </div>
                        <h3 className="lp-feature-title">{f.title}</h3>
                        <p className="lp-feature-desc">{f.desc}</p>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

/* --- How It Works --- */
const HowItWorksSection: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'client' | 'supplier'>('client');
    const steps = activeTab === 'client' ? CLIENT_STEPS : SUPPLIER_STEPS;

    return (
        <section className="lp-section lp-how-bg" id="how-it-works">
            <div className="lp-container">
                <div className="lp-section-header">
                    <div className="lp-section-badge"><Settings size={12} /> Comment ça marche</div>
                    <h2 className="lp-section-title">Simple à démarrer, puissant à l'usage</h2>
                    <p className="lp-section-subtitle">
                        Que vous soyez client ou fournisseur, Smart Supply s'adapte à votre rôle avec une expérience fluide et intuitive.
                    </p>
                </div>

                <div style={{ display: 'flex', justifyContent: 'center', marginTop: '2.5rem' }}>
                    <div className="lp-how-tabs">
                        <button
                            className={`lp-how-tab${activeTab === 'client' ? ' active' : ''}`}
                            onClick={() => setActiveTab('client')}
                        >
                            <Users size={14} style={{ marginRight: '0.375rem', verticalAlign: 'middle' }} />
                            Pour les Clients
                        </button>
                        <button
                            className={`lp-how-tab${activeTab === 'supplier' ? ' active' : ''}`}
                            onClick={() => setActiveTab('supplier')}
                        >
                            <Building2 size={14} style={{ marginRight: '0.375rem', verticalAlign: 'middle' }} />
                            Pour les Fournisseurs
                        </button>
                    </div>
                </div>

                <div className="lp-how-steps" style={{ marginTop: '1rem' }}>
                    <div className="lp-how-connector" />
                    {steps.map((step, i) => (
                        <div key={i} className="lp-how-step">
                            <div className="lp-how-step-num">{i + 1}</div>
                            <div className="lp-how-step-icon-wrap" style={{ background: step.bg, color: step.color }}>
                                {step.icon}
                            </div>
                            <div>
                                <div className="lp-how-step-title">{step.title}</div>
                                <div className="lp-how-step-desc">{step.desc}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* --- Audience Split Section --- */
const AudienceSplitSection: React.FC = () => (
    <section className="lp-section lp-audience-bg" id="for-clients">
        <div className="lp-container">
            <div className="lp-audience-header">
                <div className="lp-section-badge"><Users size={12} /> Deux audiences, une plateforme</div>
                <h2 className="lp-section-title">Conçu pour les deux côtés de la chaîne</h2>
            </div>
            <div className="lp-audience-grid">
                {/* For Clients */}
                <div className="lp-audience-card">
                    <span className="lp-audience-badge lp-audience-badge-client">
                        <ShoppingCart size={12} /> Clients et Acheteurs
                    </span>
                    <h3 className="lp-audience-title">Conçu pour les acheteurs qui veulent vitesse et confiance</h3>
                    <ul className="lp-audience-points">
                        {[
                            'Découvrez des fournisseurs fiables et vérifiés',
                            'Parcourez par catégorie et catalogue détaillé',
                            'Passez et suivez vos commandes facilement',
                            'Gérez vos achats et historiques clairement',
                            'Ouvrez des remboursements ou litiges si nécessaire',
                        ].map((pt, i) => (
                            <li key={i}>
                                <CheckCircle size={16} color="#5b73e8" />
                                <span>{pt}</span>
                            </li>
                        ))}
                    </ul>
                    <Link to="/register" className="lp-audience-cta lp-audience-cta-client">
                        Créer un compte client <ArrowRight size={16} />
                    </Link>
                </div>

                {/* For Suppliers */}
                <div className="lp-audience-card">
                    <span className="lp-audience-badge lp-audience-badge-supplier">
                        <Building2 size={12} /> Fournisseurs et Distributeurs
                    </span>
                    <h3 className="lp-audience-title">Conçu pour les fournisseurs qui veulent contrôle et croissance</h3>
                    <ul className="lp-audience-points">
                        {[
                            'Créez un profil fournisseur professionnel certifié',
                            'Listez et gérez votre catalogue de produits',
                            'Gérez vos commandes de vente efficacement',
                            'Comprenez et fidélisez vos clients actifs',
                            'Suivez vos performances et revenus en temps réel',
                        ].map((pt, i) => (
                            <li key={i}>
                                <CheckCircle size={16} color="#a855f7" />
                                <span>{pt}</span>
                            </li>
                        ))}
                    </ul>
                    <Link to="/register" className="lp-audience-cta lp-audience-cta-supplier">
                        Rejoindre en tant que fournisseur <ArrowRight size={16} />
                    </Link>
                </div>
            </div>
        </div>
    </section>
);

/* --- Categories Section --- */
const CategoriesSection: React.FC = () => (
    <section className="lp-section lp-categories-bg" id="categories">
        <div className="lp-container">
            <div className="lp-section-header">
                <div className="lp-section-badge"><Boxes size={12} /> Catégories</div>
                <h2 className="lp-section-title">Explorez par catégorie</h2>
                <p className="lp-section-subtitle">
                    Neuf catégories produit couvrant tous les besoins d'approvisionnement professionnel pour votre activité.
                </p>
            </div>
            <div className="lp-categories-grid">
                {CATEGORIES.map((cat, i) => (
                    <Link to="/login" key={i} className="lp-category-card">
                        <div className="lp-category-img" style={{ background: cat.bg }}>
                            <span>{cat.emoji}</span>
                        </div>
                        <div className="lp-category-body">
                            <div className="lp-category-name">{cat.name}</div>
                            <div className="lp-category-desc">{cat.desc}</div>
                            <div className="lp-category-footer">
                                <span className="lp-category-count">{cat.count}</span>
                                <ArrowRight size={15} className="lp-category-arrow" />
                            </div>
                        </div>
                    </Link>
                ))}
            </div>
        </div>
    </section>
);

/* --- Featured Suppliers --- */
const FeaturedSuppliersSection: React.FC = () => (
    <section className="lp-section lp-suppliers-bg">
        <div className="lp-container">
            <div className="lp-section-header">
                <div className="lp-section-badge"><Award size={12} /> Fournisseurs en vedette</div>
                <h2 className="lp-section-title">Des partenaires de confiance, prêts à vous servir</h2>
                <p className="lp-section-subtitle">
                    Découvrez quelques-uns des fournisseurs vérifiés présents sur Smart Supply, couvrant les catégories essentielles du commerce B2B.
                </p>
            </div>
            <div className="lp-suppliers-grid">
                {SUPPLIERS.map((s, i) => (
                    <div key={i} className="lp-supplier-card">
                        <div className="lp-supplier-avatar" style={{ background: s.gradient }}>
                            {s.initials}
                        </div>
                        <div className="lp-supplier-verified">
                            <ShieldCheck size={11} /> Vérifié
                        </div>
                        <div className="lp-supplier-name">{s.name}</div>
                        <div className="lp-supplier-desc">{s.desc}</div>
                        <div className="lp-supplier-meta">
                            <MapPin size={11} /> {s.location}
                        </div>
                    </div>
                ))}
            </div>
            <div style={{ textAlign: 'center', marginTop: '2.5rem' }}>
                <Link to="/login" className="lp-btn-outline-lg" style={{ fontSize: '0.9rem', padding: '0.75rem 2rem' }}>
                    Voir tous les fournisseurs <ArrowRight size={16} />
                </Link>
            </div>
        </div>
    </section>
);

/* --- Platform Preview --- */
const PlatformPreviewSection: React.FC = () => {
    const [activeScreen, setActiveScreen] = useState(0);
    const screen = PREVIEW_SCREENS[activeScreen];

    return (
        <section className="lp-section lp-preview-bg">
            <div className="lp-container">
                <div className="lp-section-header">
                    <div className="lp-section-badge"><LayoutDashboard size={12} /> Aperçu de la plateforme</div>
                    <h2 className="lp-section-title">Une interface pensée pour les professionnels</h2>
                    <p className="lp-section-subtitle">
                        Des dashboards riches, des workflows clairs et une expérience fluide sur toutes les dimensions de la plateforme.
                    </p>
                </div>

                <div className="lp-preview-tabs" style={{ marginTop: '2.5rem', justifyContent: 'center' }}>
                    {PREVIEW_SCREENS.map((s, i) => (
                        <button
                            key={i}
                            className={`lp-preview-tab${activeScreen === i ? ' active' : ''}`}
                            onClick={() => setActiveScreen(i)}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>

                <div className="lp-preview-screen">
                    <div className="lp-preview-browser-bar">
                        <div className="lp-preview-browser-dot" style={{ background: '#ef4444' }} />
                        <div className="lp-preview-browser-dot" style={{ background: '#f59e0b' }} />
                        <div className="lp-preview-browser-dot" style={{ background: '#10b981' }} />
                        <div className="lp-preview-browser-url">
                            <Lock size={10} />
                            {screen.url}
                        </div>
                    </div>

                    <div className="lp-preview-content">
                        <div className="lp-preview-sidebar">
                            <div className="lp-preview-sidebar-logo">
                                <div className="lp-preview-sidebar-logo-dot" />
                                <span className="lp-preview-sidebar-logo-text">Smart Supply</span>
                            </div>
                            {screen.navItems.map((item, i) => (
                                <div key={i} className={`lp-preview-nav-item${i === screen.activeNav ? ' active' : ''}`}>
                                    <div className={`lp-preview-nav-dot${i === screen.activeNav ? ' active' : ''}`} />
                                    {item}
                                </div>
                            ))}
                        </div>

                        <div className="lp-preview-main">
                            <div className="lp-preview-main-header">
                                <span className="lp-preview-main-title">{screen.title}</span>
                                <span className="lp-preview-badge">Temps réel</span>
                            </div>

                            <div className="lp-preview-metric-grid">
                                {screen.metrics.map((m, i) => (
                                    <div key={i} className="lp-preview-metric">
                                        <div className="lp-preview-metric-label">{m.label}</div>
                                        <div className="lp-preview-metric-value">{m.value}</div>
                                        {m.trend && <div className="lp-preview-metric-trend">{m.trend}</div>}
                                    </div>
                                ))}
                            </div>

                            <div className="lp-preview-chart">
                                {screen.chartBars.map((h, i) => (
                                    <div
                                        key={i}
                                        className="lp-preview-bar"
                                        style={{ height: `${(h / 110) * 100}%` }}
                                    />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
};

/* --- Why Choose Smart Supply --- */
const WhyChooseSection: React.FC = () => (
    <section className="lp-section lp-why-bg">
        <div className="lp-container">
            <div className="lp-section-header">
                <div className="lp-section-badge"><Award size={12} /> Pourquoi Smart Supply</div>
                <h2 className="lp-section-title">La plateforme qui met la confiance au centre</h2>
                <p className="lp-section-subtitle">
                    Smart Supply n'est pas qu'un outil de commande. C'est un écosystème B2B conçu pour construire des relations durables entre acheteurs et fournisseurs.
                </p>
            </div>
            <div className="lp-why-grid">
                {WHY_ITEMS.map((item, i) => (
                    <div key={i} className="lp-why-card">
                        <div className="lp-why-icon" style={{ background: item.bg, color: item.color }}>
                            {item.icon}
                        </div>
                        <div>
                            <div className="lp-why-title">{item.title}</div>
                            <div className="lp-why-desc">{item.desc}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

/* --- Testimonials --- */
const TestimonialsSection: React.FC = () => (
    <section className="lp-section lp-testimonials-bg">
        <div className="lp-container">
            <div className="lp-section-header">
                <div className="lp-section-badge"><Star size={12} /> Témoignages</div>
                <h2 className="lp-section-title">Ce que disent nos utilisateurs</h2>
                <p className="lp-section-subtitle">
                    Des clients et fournisseurs qui ont transformé leur façon de travailler grâce à Smart Supply.
                </p>
            </div>
            <div className="lp-testimonials-grid">
                {TESTIMONIALS.map((t, i) => (
                    <div key={i} className="lp-testimonial-card">
                        <div className="lp-testimonial-quote-mark">"</div>
                        <div className="lp-testimonial-stars">
                            {[...Array(5)].map((_, j) => <Star key={j} size={14} fill="#f59e0b" />)}
                        </div>
                        <p className="lp-testimonial-text">{t.text}</p>
                        <div className="lp-testimonial-author">
                            <div className="lp-testimonial-avatar" style={{ background: t.gradient }}>
                                {t.initials}
                            </div>
                            <div>
                                <div className="lp-testimonial-name">{t.name}</div>
                                <div className="lp-testimonial-role">{t.role}</div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

/* --- FAQ --- */
const FAQSection: React.FC = () => {
    const [openIdx, setOpenIdx] = useState<number | null>(null);

    return (
        <section className="lp-section lp-faq-bg">
            <div className="lp-container">
                <div className="lp-section-header">
                    <div className="lp-section-badge"><MessageSquare size={12} /> FAQ</div>
                    <h2 className="lp-section-title">Questions fréquentes</h2>
                    <p className="lp-section-subtitle">
                        Tout ce que vous devez savoir pour démarrer sur Smart Supply.
                    </p>
                </div>
                <div className="lp-faq-list">
                    {FAQS.map((faq, i) => (
                        <div key={i} className="lp-faq-item">
                            <div
                                className="lp-faq-question"
                                onClick={() => setOpenIdx(openIdx === i ? null : i)}
                            >
                                <span className="lp-faq-question-text">{faq.q}</span>
                                <ChevronDown
                                    size={18}
                                    className={`lp-faq-chevron${openIdx === i ? ' open' : ''}`}
                                />
                            </div>
                            <div className={`lp-faq-answer${openIdx === i ? ' open' : ''}`}>
                                <div className="lp-faq-answer-inner">{faq.a}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

/* --- Final CTA --- */
const FinalCTASection: React.FC = () => (
    <section className="lp-section lp-cta-bg">
        <div className="lp-cta-orb-1" />
        <div className="lp-cta-orb-2" />
        <div className="lp-container">
            <div className="lp-cta-inner">
                <h2 className="lp-cta-title">
                    Prêt à simplifier votre chaîne d'approvisionnement ?
                </h2>
                <p className="lp-cta-subtitle">
                    Rejoignez Smart Supply et connectez-vous avec des fournisseurs de confiance via une plateforme de commande sécurisée et moderne. Démarrez en quelques minutes.
                </p>
                <div className="lp-cta-btns">
                    <Link to="/register" className="lp-btn-white">
                        Commencer gratuitement <ArrowRight size={18} />
                    </Link>
                    <Link to="/login" className="lp-btn-white-outline">
                        Explorer la marketplace
                    </Link>
                </div>
            </div>
        </div>
    </section>
);

/* --- Footer --- */
const LandingFooter: React.FC = () => (
    <footer className="lp-footer" id="footer">
        <div className="lp-container">
            <div className="lp-footer-grid">
                <div>
                    <div className="lp-footer-logo">
                        <img src={appLogo} alt="Smart Supply" />
                        <span className="lp-footer-logo-text">Smart Supply</span>
                    </div>
                    <p className="lp-footer-desc">
                        La plateforme B2B qui connecte acheteurs professionnels et fournisseurs certifiés dans un écosystème sécurisé et transparent.
                    </p>
                    <div className="lp-footer-social">
                        <a href="#" className="lp-footer-social-btn" aria-label="LinkedIn">in</a>
                        <a href="#" className="lp-footer-social-btn" aria-label="Twitter">tw</a>
                        <a href="#" className="lp-footer-social-btn" aria-label="Email">@</a>
                    </div>
                </div>

                <div>
                    <div className="lp-footer-col-title">Plateforme</div>
                    <ul className="lp-footer-links">
                        <li><a href="#features">Fonctionnalités</a></li>
                        <li><a href="#how-it-works">Comment ça marche</a></li>
                        <li><a href="#categories">Catégories</a></li>
                        <li><a href="#for-clients">Pour les Clients</a></li>
                        <li><a href="#for-clients">Pour les Fournisseurs</a></li>
                    </ul>
                </div>

                <div>
                    <div className="lp-footer-col-title">Entreprise</div>
                    <ul className="lp-footer-links">
                        <li><a href="#home">À propos</a></li>
                        <li><a href="#footer">Contact</a></li>
                        <li><Link to="/login">Connexion</Link></li>
                        <li><Link to="/register">Inscription</Link></li>
                    </ul>
                </div>

                <div>
                    <div className="lp-footer-col-title">Contact</div>
                    <ul className="lp-footer-links">
                        <li>
                            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <MapPin size={12} /> Casablanca, Maroc
                            </a>
                        </li>
                        <li>
                            <a href="mailto:contact@smartsupply.ma" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Bell size={12} /> contact@smartsupply.ma
                            </a>
                        </li>
                        <li>
                            <a href="#" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <Globe size={12} /> smartsupply.ma
                            </a>
                        </li>
                    </ul>
                </div>
            </div>

            <div className="lp-footer-bottom">
                <span className="lp-footer-copy">
                    &copy; {new Date().getFullYear()} Smart Supply. Tous droits réservés.
                </span>
                <div className="lp-footer-legal">
                    <Link to="/client/privacy">Politique de confidentialité</Link>
                    <a href="#">Conditions d'utilisation</a>
                    <a href="#">Mentions légales</a>
                </div>
            </div>
        </div>
    </footer>
);

/* ============================================================
   MAIN EXPORT
   ============================================================ */
export const LandingPage: React.FC = () => {
    return (
        <div className="lp-page">
            <LandingNav />
            <main>
                <HeroSection />
                <TrustStrip />
                <FeaturesSection />
                <HowItWorksSection />
                <AudienceSplitSection />
                <CategoriesSection />
                <FeaturedSuppliersSection />
                <PlatformPreviewSection />
                <WhyChooseSection />
                <TestimonialsSection />
                <FAQSection />
                <FinalCTASection />
            </main>
            <LandingFooter />
        </div>
    );
};
