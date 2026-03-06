import React from 'react';

interface SoftCardProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    className?: string;
    style?: React.CSSProperties;
}

export const SoftCard: React.FC<SoftCardProps> = ({ children, title, subtitle, className = '', style }) => {
    return (
        <div className={`soft-card ${className}`} style={style}>
            {(title || subtitle) && (
                <div className="mb-3">
                    {title && <h5 className="soft-card-title mb-1">{title}</h5>}
                    {subtitle && <p className="soft-card-subtitle mb-0">{subtitle}</p>}
                </div>
            )}
            {children}
        </div>
    );
};
