import React from 'react';

interface SoftButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'outline' | 'danger';
    isLoading?: boolean;
}

export const SoftButton: React.FC<SoftButtonProps> = ({
    children,
    variant = 'primary',
    isLoading,
    className = '',
    disabled,
    ...props
}) => {
    const btnClass = variant === 'outline' ? 'soft-btn soft-btn-outline' : variant === 'danger' ? 'soft-btn btn-danger' : 'soft-btn';

    return (
        <button
            className={`${btnClass} ${className}`}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? (
                <span className="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span>
            ) : null}
            {children}
        </button>
    );
};
