import React from 'react';
import { X } from 'lucide-react';

interface SoftModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
}

export const SoftModal: React.FC<SoftModalProps> = ({ isOpen, onClose, title, children }) => {
    if (!isOpen) return null;

    return (
        <div
            className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
            style={{ zIndex: 1050, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        >
            <div className="soft-card position-relative" style={{ width: '100%', maxWidth: '500px', maxHeight: '90vh', overflowY: 'auto' }}>
                <button
                    onClick={onClose}
                    className="position-absolute cursor-pointer border-0 bg-transparent"
                    style={{ top: '1.5rem', right: '1.5rem', color: 'var(--soft-text-muted)' }}
                >
                    <X size={20} />
                </button>
                <h5 className="mb-4 fw-bold">{title}</h5>
                {children}
            </div>
        </div>
    );
};
