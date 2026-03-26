import { SoftBadge } from '../components/ui/SoftBadge';

export const ORDERED_STATUS_FLOW = [
    'EN_ATTENTE_VALIDATION',
    'VALIDEE',
    'EN_PREPARATION',
    'EXPEDIEE',
    'LIVREE',
    'ANNULEE'
];

/**
 * Formats a raw enum-style string (e.g., "HELD_IN_ESCROW")
 * into a human-readable Title Case string (e.g., "Held In Escrow").
 */
export const formatEnumLabel = (status?: string) => {
    if (!status) return 'Unknown';
    return status
        .split('_')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
};

export const getOrderStatusLabel = (status: string) => {
    switch (status) {
        case 'EN_ATTENTE_VALIDATION':
            return 'Pending';
        case 'VALIDEE':
            return 'Validated';
        case 'EN_PREPARATION':
            return 'In Preparation';
        case 'EXPEDIEE':
            return 'Shipped';
        case 'LIVREE':
            return 'Delivered';
        case 'ANNULEE':
            return 'Cancelled';
        default:
            return formatEnumLabel(status);
    }
};

export const getOrderStatusBadge = (status: string) => {
    const label = getOrderStatusLabel(status);

    switch (status) {
        case 'EN_ATTENTE_VALIDATION':
            return <SoftBadge variant="warning">{label}</SoftBadge>;
        case 'VALIDEE':
        case 'EN_PREPARATION':
        case 'EXPEDIEE':
            return <SoftBadge variant="info">{label}</SoftBadge>;
        case 'LIVREE':
            return <SoftBadge variant="success">{label}</SoftBadge>;
        case 'ANNULEE':
            return <SoftBadge variant="danger">{label}</SoftBadge>;
        default:
            return <SoftBadge variant="info">{label}</SoftBadge>;
    }
};

export const getPaymentStatusLabel = (status?: string) => {
    switch (status) {
        case 'UNPAID':
            return 'Unpaid';
        case 'HELD_IN_ESCROW':
            return 'Held in Escrow';
        case 'RELEASED':
            return 'Released';
        case 'REFUNDED':
        case 'REMBOURSEE':
            return 'Refunded';
        case 'DISPUTED':
            return 'Disputed';
        case 'PAYEE':
            return 'Paid';
        case 'EN_ATTENTE':
            return 'Pending';
        case 'ECHOUEE':
            return 'Failed';
        default:
            return status ? formatEnumLabel(status) : 'Unpaid';
    }
};

export const getPaymentStatusBadge = (status?: string) => {
    const label = getPaymentStatusLabel(status);

    switch (status) {
        case 'RELEASED':
            return <SoftBadge variant="success">{label}</SoftBadge>;
        case 'REFUNDED':
            return <SoftBadge variant="danger">{label}</SoftBadge>;
        case 'DISPUTED':
            return <SoftBadge variant="warning">{label}</SoftBadge>;
        case 'HELD_IN_ESCROW':
            return <SoftBadge variant="info">{label}</SoftBadge>;
        default:
            return <SoftBadge variant="warning">{label}</SoftBadge>;
    }
};
