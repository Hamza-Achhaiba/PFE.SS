import React from 'react';
import { SoftCard } from '../../../components/ui/SoftCard';
import { ShieldCheck, Lock, Eye, Share2, MousePointer2, UserCheck, Mail, Calendar } from 'lucide-react';

export const PrivacyPolicyPage: React.FC = () => {
    const lastUpdated = "March 14, 2026";

    const sections = [
        {
            title: "1. Introduction",
            icon: <ShieldCheck className="text-primary" size={24} />,
            content: "Welcome to Smart Supply. We are committed to protecting your business data and personal information. This Privacy Policy explains how we collect, use, and safeguard information within our B2B marketplace platform connecting suppliers and clients."
        },
        {
            title: "2. Information We Collect",
            icon: <Eye className="text-info" size={24} />,
            content: "We collect information necessary to facilitate B2B transactions, including: Business names, contact person details, trade licenses, tax IDs, shipping addresses, business phone numbers, and professional email addresses. We also collect transaction history and catalog data."
        },
        {
            title: "3. How We Use Information",
            icon: <MousePointer2 className="text-success" size={24} />,
            content: "Your information is used to: Authenticate users, facilitate order processing between suppliers and clients, provide notifications about order status, manage professional profiles, and improve our marketplace analytics. We do not use your business data for unrelated marketing purposes."
        },
        {
            title: "4. Data Sharing & Third Parties",
            icon: <Share2 className="text-warning" size={24} />,
            content: "Information is shared only between the parties involved in a transaction (e.g., sharing a client's address with a supplier for delivery). We may use trusted third-party services for cloud hosting and payment processing, and we ensure they adhere to strict confidentiality standards."
        },
        {
            title: "5. Data Security",
            icon: <Lock className="text-danger" size={24} />,
            content: "We implement industry-standard security measures, including SSL encryption and secure authentication protocols, to protect your data from unauthorized access. Your account access is protected by your professional credentials."
        },
        {
            title: "6. User Rights",
            icon: <UserCheck className="text-primary" size={24} />,
            content: "You have the right to access, correct, or delete your professional profile information at any time through your account settings. For enterprise-level data deletion requests, please contact our support team."
        },
        {
            title: "7. Cookies & Tracking",
            icon: <MousePointer2 className="text-muted" size={24} />,
            content: "We use essential session cookies to keep you logged in and functional cookies to remember your platform preferences (such as language or theme). These are necessary for the core operation of the Smart Supply platform."
        }
    ];

    return (
        <div className="container-fluid py-4">
            <div className="row justify-content-center">
                <div className="col-xl-9 col-lg-10">
                    <div className="d-flex align-items-center justify-content-between mb-4">
                        <div>
                            <h2 className="fw-bold mb-1 text-gradient-primary">Privacy Policy</h2>
                            <p className="text-muted d-flex align-items-center gap-2">
                                <Calendar size={16} /> Last Updated: {lastUpdated}
                            </p>
                        </div>
                    </div>

                    <SoftCard className="border-0 mb-5 p-4 p-md-5" style={{ borderRadius: '24px' }}>
                        <div className="mb-5">
                            <p className="lead text-muted" style={{ lineHeight: '1.8', color: 'var(--soft-text-muted)' }}>
                                At <strong style={{ color: 'var(--soft-text)' }}>Smart Supply</strong>, we value the trust you place in us when sharing your business information. 
                                This policy outlines our commitment to transparency and the ethical handling of your data in our logistics 
                                and supply chain ecosystem.
                            </p>
                        </div>

                        <div className="d-flex flex-column gap-5">
                            {sections.map((section, index) => (
                                <section key={index} className="privacy-section">
                                    <div className="d-flex align-items-center gap-3 mb-3">
                                        <div 
                                            className="p-3 rounded-4 shadow-sm border"
                                            style={{ 
                                                backgroundColor: 'var(--soft-bg)',
                                                borderColor: 'var(--soft-border)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center'
                                            }}
                                        >
                                            {section.icon}
                                        </div>
                                        <h4 className="fw-bold mb-0" style={{ color: 'var(--soft-text)' }}>{section.title}</h4>
                                    </div>
                                    <div className="ps-md-5 ms-md-2">
                                        <p className="mb-0" style={{ lineHeight: '1.7', fontSize: '1.05rem', color: 'var(--soft-text-muted)' }}>
                                            {section.content}
                                        </p>
                                    </div>
                                </section>
                            ))}
                        </div>

                        <hr className="my-5" style={{ opacity: 0.1, borderColor: 'var(--soft-text)' }} />

                        <div 
                            className="p-4 rounded-4 border"
                            style={{ 
                                background: 'rgba(91, 115, 232, 0.08)',
                                borderColor: 'rgba(91, 115, 232, 0.2)'
                            }}
                        >
                            <div className="d-flex align-items-center gap-3 mb-3">
                                <Mail className="text-primary" size={24} />
                                <h5 className="fw-bold mb-0 text-primary">Contact Our Privacy Team</h5>
                            </div>
                            <p className="mb-0 fw-medium" style={{ color: 'var(--soft-primary)', opacity: 0.85 }}>
                                If you have any questions or concerns regarding your data privacy, please reach out to us at:
                                <br />
                                <span className="fw-bold" style={{ opacity: 1 }}>privacy@smartsupply.ma</span>
                            </p>
                        </div>
                    </SoftCard>
                </div>
            </div>
        </div>
    );
};
