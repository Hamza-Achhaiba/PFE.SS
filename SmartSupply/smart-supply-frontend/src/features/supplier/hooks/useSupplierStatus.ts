import { useState, useEffect, useMemo } from 'react';
import { fournisseursApi } from '../../../api/fournisseurs.api';
import { Fournisseur } from '../../../api/types';
import { AuthStore } from '../../auth/auth.store';

export const useSupplierStatus = () => {
  const [profile, setProfile] = useState<Fournisseur | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const role = AuthStore.getRole();
  const isSupplier = role === 'FOURNISSEUR';

  useEffect(() => {
    if (!isSupplier) {
      setIsLoading(false);
      return;
    }

    const fetchStatus = async () => {
      try {
        const data = await fournisseursApi.getMe();
        setProfile(data);
      } catch (err: any) {
        console.error('Error fetching supplier status:', err);
        setError(err.message || 'Failed to fetch status');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStatus();
  }, [isSupplier]);

  const { isRestricted, restrictionMessage, canManageProducts } = useMemo(() => {
    if (!profile) return { isRestricted: false, restrictionMessage: '', canManageProducts: true };

    const status = profile.status || 'ACTIVE';
    const allowedStatuses = ['ACTIVE', 'VERIFIED'];
    const restricted = !allowedStatuses.includes(status);

    let message = '';
    switch (status) {
      case 'SUSPENDED':
        message = 'Your supplier account is suspended. Access to product management is restricted.';
        break;
      case 'REJECTED':
        message = 'Your supplier account has been rejected. You cannot manage products.';
        break;
      case 'PENDING_APPROVAL':
        message = 'Your supplier account is currently pending approval. Product management will be available once approved.';
        break;
      default:
        if (restricted) {
          message = 'Your supplier account is not fully active. Some features may be restricted.';
        }
    }

    return {
      isRestricted: restricted,
      restrictionMessage: message,
      canManageProducts: !restricted
    };
  }, [profile]);

  return {
    profile,
    status: profile?.status,
    isRestricted,
    restrictionMessage,
    canManageProducts,
    isLoading,
    error,
    isSupplier
  };
};
