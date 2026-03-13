import React, { useState, useEffect } from 'react';
import { searchApi } from '../../../api/search.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftInput } from '../../../components/ui/SoftInput';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { Truck } from 'lucide-react';

export const SuppliersPage: React.FC = () => {
  const [entreprise, setEntreprise] = useState('');

  const [fournisseurs, setFournisseurs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    searchApi.getFournisseurs(entreprise)
      .then(setFournisseurs)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [entreprise]);

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-4">Suppliers Directory</h4>

      <SoftCard className="mb-4">
        <div style={{ maxWidth: '400px' }}>
          <SoftInput
            placeholder="Search by company name..."
            value={entreprise}
            onChange={e => setEntreprise(e.target.value)}
            className="soft-search-input"
          />
        </div>
      </SoftCard>

      {isLoading ? <SoftLoader /> : (
        <div className="row g-4">
          {fournisseurs?.map((fournisseur) => (
            <div className="col-md-6 col-lg-4" key={fournisseur.id}>
              <SoftCard className="h-100 d-flex flex-column align-items-center text-center p-4">
                <div className="soft-badge info rounded-circle p-3 mb-3">
                  <Truck size={32} color="white" />
                </div>
                <h5 className="fw-bold mb-1">{fournisseur.nomEntreprise || fournisseur.nom}</h5>
                <p className="text-muted small mb-3">{fournisseur.adresse}</p>

                <div className="mt-auto w-100 text-start bg-body-tertiary p-3 rounded" style={{ background: 'var(--soft-bg)' }}>
                  <div className="small text-muted mb-1">Contact: {fournisseur.nom}</div>
                  <div className="small text-muted mb-1">Email: {fournisseur.email}</div>
                  <div className="small text-muted">Phone: {fournisseur.telephone}</div>
                </div>
              </SoftCard>
            </div>
          ))}
          {(!fournisseurs || fournisseurs.length === 0) && (
            <div className="col-12 text-center text-muted p-5">
              No suppliers found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
