import React from 'react';

export const SoftLoader: React.FC = () => {
    return (
        <div className="d-flex justify-content-center align-items-center p-5 w-100">
            <div className="spinner-border" style={{ color: 'var(--soft-primary)' }} role="status">
                <span className="visually-hidden">Loading...</span>
            </div>
        </div>
    );
};
