import { SoftBadge } from '../components/ui/SoftBadge';

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
            return status;
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
            return 'Refunded';
        case 'DISPUTED':
            return 'Disputed';
        default:
            return 'Unpaid';
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
