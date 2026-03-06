import React from 'react';

interface SoftEmptyStateProps {
    title: string;
    description?: string;
    icon?: React.ReactNode;
}

export const SoftEmptyState: React.FC<SoftEmptyStateProps> = ({ title, description, icon }) => {
    return (
        <div className="text-center p-5 w-100 h-100 d-flex flex-column justify-content-center align-items-center">
            {icon && <div className="mb-3 text-muted">{icon}</div>}
            <h5 className="fw-bold" style={{ color: 'var(--soft-text)' }}>{title}</h5>
            {description && <p style={{ color: 'var(--soft-text-muted)' }}>{description}</p>}
        </div>
    );
};
