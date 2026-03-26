import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthGuard } from '../features/auth/auth.guard';
import { PageShell } from '../components/layout/PageShell';

// Auth
import { LoginPage } from '../features/auth/pages/LoginPage';
import { RegisterPage } from '../features/auth/pages/RegisterPage';
import { SettingsPage } from '../features/shared/pages/SettingsPage';
import { PrivacyPolicyPage } from '../features/shared/pages/PrivacyPolicyPage';
import { MessagesPage } from '../features/messages/pages/MessagesPage';

// Client Pages
import { Dashboard as ClientDashboard } from '../features/client/pages/Dashboard';
import { Categories } from '../features/client/pages/Categories';
import { CatalogPage } from '../features/client/pages/CatalogPage';
import { SearchPage } from '../features/client/pages/SearchPage';
import { CartPage } from '../features/client/pages/CartPage';
import { CheckoutPage } from '../features/client/pages/CheckoutPage';
import { OrdersPage } from '../features/client/pages/OrdersPage';
import { SuppliersPage } from '../features/client/pages/SuppliersPage';
import { SupplierProfilePage } from '../features/client/pages/SupplierProfilePage';
import { FavoritesPage } from '../features/client/pages/FavoritesPage';
import { NotificationsPage as ClientNotifications } from '../features/client/pages/NotificationsPage';

// Supplier Pages
import { Dashboard as SupplierDashboard } from '../features/supplier/pages/Dashboard';
import { ProductsPage } from '../features/supplier/pages/ProductsPage';
import { SalesOrdersPage } from '../features/supplier/pages/SalesOrdersPage';
import { ClientsPage } from '../features/supplier/pages/ClientsPage';
import { NotificationsPage as SupplierNotifications } from '../features/supplier/pages/NotificationsPage';
import { SupplierProfilePage as MyProfilePage } from '../features/supplier/pages/SupplierProfilePage';

// Admin Pages
import { AdminDashboard } from '../features/admin/pages/AdminDashboard';
import { AdminClientsPage } from '../features/admin/pages/AdminClientsPage';
import { AdminSuppliersPage } from '../features/admin/pages/AdminSuppliersPage';
import { AdminOrdersPage } from '../features/admin/pages/AdminOrdersPage';
import { AdminDisputesPage } from '../features/admin/pages/AdminDisputesPage';
import { AdminProductsPage } from '../features/admin/pages/AdminProductsPage';
import { AdminActivityLogsPage } from '../features/admin/pages/AdminActivityLogsPage';

export const AppRoutes = () => {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<Navigate to="/login" replace />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/register" element={<RegisterPage />} />

                {/* Client Routes */}
                <Route element={<AuthGuard allowedRole="CLIENT" />}>
                    <Route path="/client" element={<PageShell />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<ClientDashboard />} />
                        <Route path="categories" element={<Categories />} />
                        <Route path="catalog" element={<CatalogPage />} />
                        <Route path="search" element={<SearchPage />} />
                        <Route path="cart" element={<CartPage />} />
                        <Route path="checkout" element={<CheckoutPage />} />
                        <Route path="orders" element={<OrdersPage />} />
                        <Route path="suppliers" element={<SuppliersPage />} />
                        <Route path="suppliers/:id" element={<SupplierProfilePage />} />
                        <Route path="favorites" element={<FavoritesPage />} />
                        <Route path="notifications" element={<ClientNotifications />} />
                        <Route path="messages" element={<MessagesPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="privacy" element={<PrivacyPolicyPage />} />
                    </Route>
                </Route>

                {/* Supplier Routes */}
                <Route element={<AuthGuard allowedRole="FOURNISSEUR" />}>
                    <Route path="/supplier" element={<PageShell />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<SupplierDashboard />} />
                        <Route path="products" element={<ProductsPage />} />
                        <Route path="orders" element={<SalesOrdersPage />} />
                        <Route path="clients" element={<ClientsPage />} />
                        <Route path="notifications" element={<SupplierNotifications />} />
                        <Route path="profile" element={<MyProfilePage />} />
                        <Route path="messages" element={<MessagesPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="privacy" element={<PrivacyPolicyPage />} />
                    </Route>
                </Route>

                {/* Admin Routes */}
                <Route element={<AuthGuard allowedRole="ADMIN" />}>
                    <Route path="/admin" element={<PageShell />}>
                        <Route index element={<Navigate to="dashboard" replace />} />
                        <Route path="dashboard" element={<AdminDashboard />} />
                        <Route path="clients" element={<AdminClientsPage />} />
                        <Route path="suppliers" element={<AdminSuppliersPage />} />
                        <Route path="products" element={<AdminProductsPage />} />
                        <Route path="orders" element={<AdminOrdersPage />} />
                        <Route path="disputes" element={<AdminDisputesPage />} />
                        <Route path="activity-logs" element={<AdminActivityLogsPage />} />
                        <Route path="settings" element={<SettingsPage />} />
                        <Route path="privacy" element={<PrivacyPolicyPage />} />
                    </Route>
                </Route>

                <Route path="*" element={<Navigate to="/login" replace />} />
            </Routes>
        </BrowserRouter>
    );
};
