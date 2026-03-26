import { apiClient } from './axios';

export const adminApi = {
    getDashboardMetrics: () => apiClient.get('/api/admin/metrics').then(res => res.data),
    getChartData: () => apiClient.get('/api/admin/chart-data').then(res => res.data),
    getSuppliers: () => apiClient.get('/api/admin/fournisseurs').then(res => res.data),
    deleteSupplier: (id: number) => apiClient.delete(`/api/admin/fournisseurs/${id}`).then(res => res.data),
    getClients: () => apiClient.get('/api/admin/clients').then(res => res.data),
    getOrders: () => apiClient.get('/api/admin/commandes').then(res => res.data),
    getDisputes: () => apiClient.get('/api/admin/disputes').then(res => res.data),
    updateSupplierStatus: (id: number, status: string) =>
        apiClient.patch(`/api/fournisseurs/${id}/status`, null, { params: { status } }).then(res => res.data),
    updateClientStatus: (id: number, status: string) =>
        apiClient.patch(`/api/admin/clients/${id}/status`, null, { params: { status } }).then(res => res.data),
    deleteClient: (id: number) =>
        apiClient.delete(`/api/admin/clients/${id}`).then(res => res.data),
    resolveDispute: (id: number) =>
        apiClient.patch(`/api/admin/commandes/${id}/resolve-dispute`).then(res => res.data),
    refundDecision: (id: number, decision: string) =>
        apiClient.patch(`/api/admin/commandes/${id}/refund-decision`, null, { params: { decision } }).then(res => res.data),

    // Product management
    getProducts: () => apiClient.get('/api/admin/produits').then(res => res.data),
    updateProductStatus: (id: number, statut: string) =>
        apiClient.patch(`/api/admin/produits/${id}/statut`, null, { params: { statut } }).then(res => res.data),
    deleteProduct: (id: number) =>
        apiClient.delete(`/api/admin/produits/${id}`).then(res => res.data),

    // Activity Logs
    getActivityLogs: () => apiClient.get('/api/admin/activity-logs').then(res => res.data),
};
