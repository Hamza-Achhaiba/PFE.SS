import { apiClient } from './axios';

export interface SupplierAnalyticsStats {
    chiffreAffairesTotal: number;
    nombreCommandes: number;
    nombreClients: number;
    produitsEnRupture: number;
}

export interface SalesTimelinePoint {
    date: string;
    revenue: number;
}

export interface SpendingTimelinePoint {
    date: string;
    spending: number;
}

export interface TopProductPoint {
    produitId: number;
    nomProduit: string;
    totalVendu: number;
    chiffreAffaires: number;
}

export const analyticsApi = {
    getStats: () => apiClient.get<SupplierAnalyticsStats>('/api/analytics/fournisseur/stats').then(res => res.data),
    getSalesTimeline: () => apiClient.get<SalesTimelinePoint[]>('/api/analytics/fournisseur/sales-timeline').then(res => res.data),
    getClientSpendingTimeline: () => apiClient.get<SpendingTimelinePoint[]>('/api/analytics/client/spending-timeline').then(res => res.data),
    getTopProducts: () => apiClient.get<TopProductPoint[]>('/api/analytics/fournisseur/top-produits').then(res => res.data),
};
