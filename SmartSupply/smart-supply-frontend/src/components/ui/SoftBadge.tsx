import React from 'react';

interface SoftBadgeProps {
    variant?: 'success' | 'warning' | 'danger' | 'info';
    children: React.ReactNode;
    className?: string;
}

export const SoftBadge: React.FC<SoftBadgeProps> = ({ variant = 'info', children, className = '' }) => {
    return (
        <span className={`soft-badge ${variant} ${className}`}>
            {children}
        </span>
    );
};
