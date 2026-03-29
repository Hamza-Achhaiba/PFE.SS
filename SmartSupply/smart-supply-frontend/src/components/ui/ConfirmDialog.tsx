import React from 'react';
import { SoftModal } from './SoftModal';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    entityName?: string;
    confirmLabel: string;
    isLoading?: boolean;
    loadingLabel?: string;
}

export const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    entityName,
    confirmLabel,
    isLoading = false,
    loadingLabel,
}) => {
    return (
        <SoftModal isOpen={isOpen} onClose={() => !isLoading && onClose()} title={title}>
            <div className="py-2">
                <p className="text-body mb-2" style={{ fontSize: '0.95rem', lineHeight: 1.6 }}>
                    {message}
                </p>
                {entityName && (
                    <p
                        className="text-muted small mb-0 fw-medium"
                        style={{ fontSize: '0.82rem' }}
                    >
                        {entityName}
                    </p>
                )}
                <div className="d-flex justify-content-end gap-2 mt-4">
                    <button
                        type="button"
                        className="btn btn-sm px-3 rounded-pill fw-medium"
                        onClick={onClose}
                        disabled={isLoading}
                        style={{
                            border: '1px solid rgba(15, 23, 42, 0.08)',
                            background: 'rgba(148, 163, 184, 0.10)',
                            color: 'var(--soft-text, #0f172a)',
                        }}
                    >
                        Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-sm px-3 rounded-pill fw-medium border-0"
                        onClick={onConfirm}
                        disabled={isLoading}
                        style={{
                            background: 'rgba(220, 53, 69, 0.14)',
                            color: '#dc3545',
                        }}
                    >
                        {isLoading ? (loadingLabel || 'Processing...') : confirmLabel}
                    </button>
                </div>
            </div>
        </SoftModal>
    );
};
