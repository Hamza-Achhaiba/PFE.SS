import React, { useState, useEffect } from 'react';
import { searchApi } from '../../../api/search.api';
import { SoftCard } from '../../../components/ui/SoftCard';
import { SoftInput } from '../../../components/ui/SoftInput';
import { SoftLoader } from '../../../components/ui/SoftLoader';
import { Users } from 'lucide-react';

export const ClientsPage: React.FC = () => {
  const [magasin, setMagasin] = useState('');

  const [clients, setClients] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setIsLoading(true);
    searchApi.getClients(magasin)
      .then(setClients)
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, [magasin]);

  return (
    <div className="container-fluid p-0">
      <h4 className="fw-bold mb-4">Clients Directory</h4>

      <SoftCard className="mb-4">
        <div style={{ maxWidth: '400px' }}>
          <SoftInput
            placeholder="Search by store name..."
            value={magasin}
            onChange={e => setMagasin(e.target.value)}
            className="soft-search-input"
          />
        </div>
      </SoftCard>

      {isLoading ? <SoftLoader /> : (
        <div className="row g-4">
          {clients?.map((client) => (
            <div className="col-md-6 col-lg-4" key={client.id}>
              <SoftCard className="h-100 d-flex flex-column align-items-center text-center p-4">
                <div className="soft-badge info rounded-circle p-3 mb-3" style={{ background: 'var(--soft-bg)' }}>
                  <Users size={32} color="var(--soft-primary)" />
                </div>
                <h5 className="fw-bold mb-1">{client.nomMagasin || client.nom}</h5>
                <p className="text-muted small mb-3">{client.adresse}</p>

                <div className="mt-auto w-100 text-start bg-light p-3 rounded" style={{ background: 'var(--soft-bg)' }}>
                  <div className="small text-muted mb-1">Contact: {client.nom}</div>
                  <div className="small text-muted mb-1">Email: {client.email}</div>
                  <div className="small text-muted">Phone: {client.telephone}</div>
                </div>
              </SoftCard>
            </div>
          ))}
          {(!clients || clients.length === 0) && (
            <div className="col-12 text-center text-muted p-5">
              No clients found.
            </div>
          )}
        </div>
      )}
    </div>
  );
};
