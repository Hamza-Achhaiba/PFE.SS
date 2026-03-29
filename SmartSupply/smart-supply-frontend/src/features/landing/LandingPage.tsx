import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ShieldCheck, Truck, BarChart3, MessageSquare,
    ArrowRight, Building2, Users, TrendingUp, Lock,
    Search, Menu, X, Package, ClipboardList, Zap,
} from 'lucide-react';
import appLogo from '../../assets/app-logo.png';
import './LandingPage.css';

/* ─────────────────────────────────────────────────────────
   DATA
───────────────────────────────────────────────────────── */

const FEATURES = [
    {
        icon: <ShieldCheck size={22} />,
        bg: 'rgba(91,115,232,0.1)', color: '#5b73e8',
        title: 'Verified Suppliers',
        desc: 'Every supplier is reviewed and approved before going live on the platform.',
    },
    {
        icon: <Lock size={22} />,
        bg: 'rgba(168,85,247,0.1)', color: '#a855f7',
        title: 'Secure Ordering',
        desc: 'Place orders confidently with protected flows and transaction oversight.',
    },
    {
        icon: <Truck size={22} />,
        bg: 'rgba(245,158,11,0.1)', color: '#f59e0b',
        title: 'Logistics & Tracking',
        desc: 'Monitor delivery status and fulfillment updates in real time.',
    },
    {
        icon: <BarChart3 size={22} />,
        bg: 'rgba(59,130,246,0.1)', color: '#3b82f6',
        title: 'Dashboards & Analytics',
        desc: 'Client, supplier, and admin dashboards built for operational clarity.',
    },
    {
        icon: <Search size={22} />,
        bg: 'rgba(16,185,129,0.1)', color: '#10b981',
        title: 'Product Discovery',
        desc: 'Browse structured categories and find products across trusted suppliers.',
    },
    {
        icon: <MessageSquare size={22} />,
        bg: 'rgba(239,68,68,0.1)', color: '#ef4444',
        title: 'Disputes & Refunds',
        desc: 'Resolve issues through structured, transparent refund workflows.',
    },
];

const CLIENT_STEPS = [
    { title: 'Discover Suppliers', desc: 'Browse verified supplier profiles by category.' },
    { title: 'Browse Products',    desc: 'Explore detailed catalogs and product listings.' },
    { title: 'Place Orders',       desc: 'Add to cart and checkout securely in one flow.' },
    { title: 'Track Deliveries',   desc: 'Follow every order from confirmation to delivery.' },
];

const SUPPLIER_STEPS = [
    { title: 'Create Profile',    desc: 'Set up a professional, verified business profile.' },
    { title: 'Publish Products',  desc: 'List your catalog with full descriptions and pricing.' },
    { title: 'Manage Orders',     desc: 'Receive, confirm, and process orders in one place.' },
    { title: 'Grow with Insights', desc: 'Track revenue, clients, and performance over time.' },
];

const PREVIEW_POINTS = [
    {
        icon: <BarChart3 size={18} />,
        title: 'Client Dashboard',
        desc: 'Spending insights, active suppliers, and order history at a glance.',
    },
    {
        icon: <Building2 size={18} />,
        title: 'Supplier Dashboard',
        desc: 'Order pipeline, revenue metrics, and client engagement overview.',
    },
    {
        icon: <ClipboardList size={18} />,
        title: 'Order Management',
        desc: 'Full lifecycle visibility from creation to fulfillment.',
    },
    {
        icon: <Package size={18} />,
        title: 'Supplier Profiles',
        desc: 'Rich, verified profiles with product catalogs and ratings.',
    },
];

const CHART_BARS = [30, 48, 38, 62, 54, 74, 60, 83, 70, 80, 68, 90];

/* ─────────────────────────────────────────────────────────
   NAVBAR
───────────────────────────────────────────────────────── */
const Nav: React.FC = () => {
    const [scrolled, setScrolled]     = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 28);
        window.addEventListener('scroll', fn, { passive: true });
        return () => window.removeEventListener('scroll', fn);
    }, []);

    const go = (id: string) => {
        document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
        setDrawerOpen(false);
    };

    return (
        <nav className={`lp-nav${scrolled ? ' scrolled' : ''}`}>
            <div className="lp-nav-inner">
                <Link to="/" className="lp-logo">
                    <img src={appLogo} alt="Smart Supply" />
                    <span className="lp-logo-name">Smart Supply</span>
                </Link>

                <ul className="lp-nav-links">
                    <li><a href="#home"         onClick={e => { e.preventDefault(); go('home'); }}>Home</a></li>
                    <li><a href="#features"     onClick={e => { e.preventDefault(); go('features'); }}>Features</a></li>
                    <li><a href="#how-it-works" onClick={e => { e.preventDefault(); go('how-it-works'); }}>How It Works</a></li>
                    <li><a href="#contact"      onClick={e => { e.preventDefault(); go('contact'); }}>Contact</a></li>
                </ul>

                <div className="lp-nav-actions">
                    <Link to="/login"    className="lp-btn lp-btn-ghost">Login</Link>
                    <Link to="/register" className="lp-btn lp-btn-primary">Get Started</Link>
                </div>

                <button className="lp-nav-toggle" onClick={() => setDrawerOpen(v => !v)} aria-label="Menu">
                    {drawerOpen ? <X size={17} /> : <Menu size={17} />}
                </button>
            </div>

            <div className={`lp-nav-drawer${drawerOpen ? ' open' : ''}`}>
                <a href="#home"         onClick={e => { e.preventDefault(); go('home'); }}>Home</a>
                <a href="#features"     onClick={e => { e.preventDefault(); go('features'); }}>Features</a>
                <a href="#how-it-works" onClick={e => { e.preventDefault(); go('how-it-works'); }}>How It Works</a>
                <a href="#contact"      onClick={e => { e.preventDefault(); go('contact'); }}>Contact</a>
                <div className="lp-nav-drawer-actions">
                    <Link to="/login"    className="lp-btn lp-btn-ghost"    onClick={() => setDrawerOpen(false)}>Login</Link>
                    <Link to="/register" className="lp-btn lp-btn-primary"  onClick={() => setDrawerOpen(false)}>Get Started</Link>
                </div>
            </div>
        </nav>
    );
};

/* ─────────────────────────────────────────────────────────
   HERO
───────────────────────────────────────────────────────── */
const Hero: React.FC = () => (
    <section className="lp-hero" id="home">
        <div className="lp-wrap">
            <div className="lp-hero-grid">

                {/* — Text — */}
                <div>
                    <div className="lp-hero-eyebrow">
                        <span className="lp-hero-dot" />
                        B2B Sourcing Platform
                    </div>
                    <h1 className="lp-hero-h1">
                        Smart Supply —{' '}
                        <em>smarter sourcing</em>{' '}
                        for modern businesses
                    </h1>
                    <p className="lp-hero-sub">
                        Connect with trusted suppliers, place orders securely, and manage your business in one modern platform.
                    </p>
                    <div className="lp-hero-ctas">
                        <Link to="/register" className="lp-btn lp-btn-primary" style={{ fontSize: '0.95rem', padding: '0.8rem 1.875rem' }}>
                            Get Started <ArrowRight size={17} />
                        </Link>
                        <Link to="/login" className="lp-btn lp-btn-outline" style={{ fontSize: '0.95rem', padding: '0.8rem 1.875rem' }}>
                            Explore Suppliers
                        </Link>
                    </div>
                </div>

                {/* — App card visual — */}
                <div className="lp-hero-visual">
                    <div className="lp-app-card">
                        <div className="lp-app-topbar">
                            <div className="lp-app-dot" /><div className="lp-app-dot" /><div className="lp-app-dot" />
                            <span className="lp-app-title">Smart Supply — Dashboard</span>
                        </div>
                        <div className="lp-app-body">
                            <div className="lp-app-stats">
                                <div className="lp-app-stat">
                                    <div className="lp-app-stat-label">Orders</div>
                                    <div className="lp-app-stat-val">48</div>
                                    <div className="lp-app-stat-up">+12%</div>
                                </div>
                                <div className="lp-app-stat">
                                    <div className="lp-app-stat-label">Suppliers</div>
                                    <div className="lp-app-stat-val">9</div>
                                    <div className="lp-app-stat-up">active</div>
                                </div>
                                <div className="lp-app-stat">
                                    <div className="lp-app-stat-label">Spend</div>
                                    <div className="lp-app-stat-val" style={{ fontSize: '0.82rem' }}>14 820</div>
                                    <div className="lp-app-stat-up">MAD / mo</div>
                                </div>
                            </div>
                            <div className="lp-app-rows">
                                <div className="lp-app-row">
                                    <div className="lp-app-row-icon" style={{ background: 'rgba(91,115,232,0.1)' }}>📦</div>
                                    <div className="lp-app-row-info">
                                        <div className="lp-app-row-name">Distribution Al Baraka</div>
                                        <div className="lp-app-row-sub">Today, 09:14</div>
                                    </div>
                                    <span className="lp-status lp-status-on">Processing</span>
                                </div>
                                <div className="lp-app-row">
                                    <div className="lp-app-row-icon" style={{ background: 'rgba(16,185,129,0.1)' }}>🥤</div>
                                    <div className="lp-app-row-info">
                                        <div className="lp-app-row-name">Atlas Boissons Pro</div>
                                        <div className="lp-app-row-sub">Yesterday, 14:30</div>
                                    </div>
                                    <span className="lp-status lp-status-ok">Delivered</span>
                                </div>
                                <div className="lp-app-row">
                                    <div className="lp-app-row-icon" style={{ background: 'rgba(245,158,11,0.1)' }}>🥛</div>
                                    <div className="lp-app-row-info">
                                        <div className="lp-app-row-name">Laiterie du Nord</div>
                                        <div className="lp-app-row-sub">Jan 24, 11:00</div>
                                    </div>
                                    <span className="lp-status lp-status-pnd">Pending</span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    </section>
);

/* ─────────────────────────────────────────────────────────
   TRUST STRIP
───────────────────────────────────────────────────────── */
const TrustStrip: React.FC = () => (
    <section className="lp-trust">
        <div className="lp-wrap">
            <div className="lp-trust-row">
                {[
                    { icon: <ShieldCheck size={15} />, label: 'Verified Suppliers' },
                    { icon: <Lock        size={15} />, label: 'Secure Payments'    },
                    { icon: <Truck       size={15} />, label: 'Order Tracking'     },
                    { icon: <Zap         size={15} />, label: 'Escrow Protection'  },
                    { icon: <TrendingUp  size={15} />, label: 'Business-Ready Workflows' },
                ].map((t, i) => (
                    <div key={i} className="lp-trust-item">
                        <div className="lp-trust-icon">{t.icon}</div>
                        {t.label}
                    </div>
                ))}
            </div>
        </div>
    </section>
);

/* ─────────────────────────────────────────────────────────
   FEATURES
───────────────────────────────────────────────────────── */
const Features: React.FC = () => (
    <section className="lp-section lp-features-bg" id="features">
        <div className="lp-wrap">
            <div className="lp-center">
                <div className="lp-label"><Zap size={12} /> Features</div>
                <h2 className="lp-h2">Everything your business needs</h2>
                <p className="lp-lead">
                    A complete B2B toolkit — from supplier discovery to order management — built for operational clarity.
                </p>
            </div>

            <div className="lp-features-grid">
                {FEATURES.map((f, i) => (
                    <div key={i} className="lp-feature">
                        <div className="lp-feature-icon" style={{ background: f.bg, color: f.color }}>
                            {f.icon}
                        </div>
                        <div className="lp-feature-title">{f.title}</div>
                        <div className="lp-feature-desc">{f.desc}</div>
                    </div>
                ))}
            </div>
        </div>
    </section>
);

/* ─────────────────────────────────────────────────────────
   HOW IT WORKS
───────────────────────────────────────────────────────── */
const HowItWorks: React.FC = () => (
    <section className="lp-section lp-how-bg" id="how-it-works">
        <div className="lp-wrap">
            <div className="lp-center">
                <div className="lp-label">How It Works</div>
                <h2 className="lp-h2">Simple for both sides</h2>
                <p className="lp-lead">
                    Whether you're sourcing or selling, Smart Supply fits your workflow in four clear steps.
                </p>
            </div>

            <div className="lp-how-cols">
                {/* Clients */}
                <div className="lp-how-col">
                    <span className="lp-how-col-badge client"><Users size={11} /> For Clients</span>
                    <div className="lp-how-col-title">Discover, order, and track</div>
                    <div className="lp-how-steps">
                        {CLIENT_STEPS.map((s, i) => (
                            <div key={i} className="lp-how-step">
                                <div className="lp-how-num">{i + 1}</div>
                                <div>
                                    <div className="lp-how-step-title">{s.title}</div>
                                    <div className="lp-how-step-desc">{s.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/register" className="lp-btn lp-btn-outline" style={{ marginTop: '1.75rem' }}>
                        Start as a client <ArrowRight size={15} />
                    </Link>
                </div>

                {/* Suppliers */}
                <div className="lp-how-col">
                    <span className="lp-how-col-badge supplier"><Building2 size={11} /> For Suppliers</span>
                    <div className="lp-how-col-title">List, sell, and grow</div>
                    <div className="lp-how-steps">
                        {SUPPLIER_STEPS.map((s, i) => (
                            <div key={i} className="lp-how-step">
                                <div className="lp-how-num supplier">{i + 1}</div>
                                <div>
                                    <div className="lp-how-step-title">{s.title}</div>
                                    <div className="lp-how-step-desc">{s.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Link to="/register" className="lp-btn lp-btn-outline" style={{ marginTop: '1.75rem', borderColor: '#a855f7', color: '#a855f7' }}>
                        Join as a supplier <ArrowRight size={15} />
                    </Link>
                </div>
            </div>
        </div>
    </section>
);

/* ─────────────────────────────────────────────────────────
   PLATFORM PREVIEW
───────────────────────────────────────────────────────── */
const PlatformPreview: React.FC = () => (
    <section className="lp-section lp-preview-bg">
        <div className="lp-wrap">
            <div className="lp-preview-grid">

                {/* Mock screen */}
                <div className="lp-screen">
                    <div className="lp-screen-bar">
                        <div className="lp-screen-dot" style={{ background: '#ef4444' }} />
                        <div className="lp-screen-dot" style={{ background: '#f59e0b' }} />
                        <div className="lp-screen-dot" style={{ background: '#10b981' }} />
                        <div className="lp-screen-url">
                            <Lock size={9} /> smart-supply.com/client/dashboard
                        </div>
                    </div>

                    <div className="lp-screen-layout">
                        <div className="lp-screen-side">
                            <div className="lp-screen-logo">
                                <div className="lp-screen-logo-dot" />
                                <span className="lp-screen-logo-name">Smart Supply</span>
                            </div>
                            {['Dashboard', 'Categories', 'Orders', 'Suppliers', 'Analytics'].map((item, i) => (
                                <div key={i} className={`lp-screen-nav-item${i === 0 ? ' active' : ''}`}>
                                    <div className={`lp-screen-nav-dot${i === 0 ? ' active' : ''}`} />
                                    {item}
                                </div>
                            ))}
                        </div>

                        <div className="lp-screen-main">
                            <div className="lp-screen-header">
                                <span className="lp-screen-title">Client Dashboard</span>
                                <span className="lp-screen-badge">Live</span>
                            </div>
                            <div className="lp-screen-metrics">
                                {[
                                    { label: 'Total Orders', val: '48', up: '+12%' },
                                    { label: 'Active Suppliers', val: '9', up: '+3' },
                                    { label: 'Monthly Spend', val: '14 820 MAD', up: '+8%' },
                                ].map((m, i) => (
                                    <div key={i} className="lp-screen-metric">
                                        <div className="lp-screen-metric-label">{m.label}</div>
                                        <div className="lp-screen-metric-val">{m.val}</div>
                                        <div className="lp-screen-metric-up">{m.up}</div>
                                    </div>
                                ))}
                            </div>
                            <div className="lp-screen-chart">
                                {CHART_BARS.map((h, i) => (
                                    <div key={i} className="lp-screen-bar" style={{ height: `${(h / 92) * 100}%` }} />
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Points */}
                <div>
                    <div className="lp-label">Platform Preview</div>
                    <h2 className="lp-h2">Built for serious B2B operations</h2>
                    <p className="lp-lead">
                        A professional-grade interface designed for both sides of the supply chain, with real-time data and clear workflows.
                    </p>
                    <div className="lp-preview-points">
                        {PREVIEW_POINTS.map((p, i) => (
                            <div key={i} className="lp-preview-point">
                                <div className="lp-preview-point-icon">{p.icon}</div>
                                <div>
                                    <div className="lp-preview-point-title">{p.title}</div>
                                    <div className="lp-preview-point-desc">{p.desc}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

            </div>
        </div>
    </section>
);

/* ─────────────────────────────────────────────────────────
   FINAL CTA + FOOTER
───────────────────────────────────────────────────────── */
const CTAAndFooter: React.FC = () => {
    const scrollTo = (id: string) => document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });

    return (
        <div className="lp-cta-footer" id="contact">
            {/* CTA */}
            <div className="lp-wrap">
                <div className="lp-cta-block">
                    <h2 className="lp-cta-h2">Ready to simplify your supply chain?</h2>
                    <p className="lp-cta-sub">
                        Join Smart Supply and connect with trusted suppliers through a secure, modern sourcing platform.
                    </p>
                    <div className="lp-cta-btns">
                        <Link to="/register" className="lp-btn lp-btn-white" style={{ fontSize: '0.95rem', padding: '0.8rem 2rem' }}>
                            Get Started <ArrowRight size={17} />
                        </Link>
                        <Link to="/login" className="lp-btn lp-btn-white-ghost" style={{ fontSize: '0.95rem', padding: '0.8rem 2rem' }}>
                            Explore Marketplace
                        </Link>
                    </div>
                </div>
            </div>

            {/* Footer */}
            <footer className="lp-footer" id="footer">
                <div className="lp-wrap">
                    <div className="lp-footer-inner">

                        {/* Brand */}
                        <div>
                            <div className="lp-footer-logo">
                                <img src={appLogo} alt="Smart Supply" />
                                <span className="lp-footer-logo-name">Smart Supply</span>
                            </div>
                            <p className="lp-footer-desc">
                                The B2B marketplace connecting professional buyers with verified suppliers in a secure, modern platform.
                            </p>
                        </div>

                        {/* Platform */}
                        <div>
                            <div className="lp-footer-col-title">Platform</div>
                            <ul className="lp-footer-links">
                                <li><button onClick={() => scrollTo('features')}>Features</button></li>
                                <li><button onClick={() => scrollTo('how-it-works')}>How It Works</button></li>
                                <li><Link to="/login">Supplier Discovery</Link></li>
                            </ul>
                        </div>

                        {/* Company */}
                        <div>
                            <div className="lp-footer-col-title">Company</div>
                            <ul className="lp-footer-links">
                                <li><Link to="/login">Login</Link></li>
                                <li><Link to="/register">Get Started</Link></li>
                                <li><button onClick={() => scrollTo('contact')}>Contact</button></li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <div className="lp-footer-col-title">Legal</div>
                            <ul className="lp-footer-links">
                                <li><Link to="/client/privacy">Privacy Policy</Link></li>
                                <li><a href="#">Terms of Service</a></li>
                                <li><a href="#">Legal Notice</a></li>
                            </ul>
                        </div>

                    </div>

                    <div className="lp-footer-bottom">
                        <span className="lp-footer-copy">
                            &copy; {new Date().getFullYear()} Smart Supply. All rights reserved.
                        </span>
                        <div className="lp-footer-legal">
                            <Link to="/client/privacy">Privacy</Link>
                            <a href="#">Terms</a>
                            <a href="#">Legal</a>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
};

/* ─────────────────────────────────────────────────────────
   PAGE
───────────────────────────────────────────────────────── */
export const LandingPage: React.FC = () => (
    <div className="lp-page">
        <Nav />
        <main>
            <Hero />
            <TrustStrip />
            <Features />
            <HowItWorks />
            <PlatformPreview />
        </main>
        <CTAAndFooter />
    </div>
);
