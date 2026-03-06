import React, { forwardRef } from 'react';

interface SoftInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    label?: string;
    error?: string;
}

export const SoftInput = forwardRef<HTMLInputElement, SoftInputProps>(
    ({ label, error, className = '', ...props }, ref) => {
        return (
            <div className="soft-input-group">
                {label && <label className="soft-label">{label}</label>}
                <input
                    ref={ref}
                    className={`soft-input ${error ? 'error' : ''} ${className}`}
                    {...props}
                />
                {error && <span className="error-text">{error}</span>}
            </div>
        );
    }
);
SoftInput.displayName = 'SoftInput';
