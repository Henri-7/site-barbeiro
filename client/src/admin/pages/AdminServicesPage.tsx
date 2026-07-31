import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Plus } from 'lucide-react';
import { useState } from 'react';
import { AdminModal } from '../components/common/AdminModal';
import { AdminEmpty, AdminError, AdminLoading } from '../components/common/AdminState';
import { queryKeys } from '../lib/queryKeys';
import { adminRequest, exportCsv } from '../services/adminApi';
import { formatCurrency } from '../../utils/currency';

type AdminService = {
  id: string;
  name: string;
  description: string;
  price: number;
  duration_minutes: number;
  active: boolean;
  featured: boolean;
  display_order?: number;
  category?: string;
};

const blank: AdminService = {
  id: '',
  name: '',
  description: '',
  price: 0,
  duration_minutes: 30,
  active: true,
  featured: false,
  display_order: 0,
  category: '',
};

export function AdminServicesPage() {
  const [editing, setEditing] = useState<AdminService | null>(null);
  const client = useQueryClient();
  const query = useQuery({ queryKey: queryKeys.services, queryFn: () => adminRequest<AdminService[]>('/services') });
  const save = useMutation({
    mutationFn: (service: AdminService) =>
      adminRequest<AdminService>(service.id ? `/services/${service.id}` : '/services', {
        method: service.id ? 'PATCH' : 'POST',
        body: JSON.stringify(service),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.services }),
  });
  const remove = useMutation({
    mutationFn: (id: string) => adminRequest(`/services/${id}`, { method: 'DELETE' }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.services }),
  });

  if (query.isLoading) return <AdminLoading />;
  if (query.isError) return <AdminError text="Não foi possível carregar serviços." onRetry={() => void query.refetch()} />;

  const services = query.data || [];

  return (
    <section className="admin-card">
      <div className="admin-section-title">
        <h2>Serviços e preços</h2>
        <div className="admin-actions">
          <button className="admin-button secondary" type="button" onClick={() => exportCsv('serviços.csv', services)}>
            <Download size={17} />
            CSV
          </button>
          <button className="admin-button primary" type="button" onClick={() => setEditing(blank)}>
            <Plus size={17} />
            Novo serviço
          </button>
        </div>
      </div>

      {services.length === 0 ? (
        <AdminEmpty />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Serviço</th>
                <th>Preço</th>
                <th>Duração</th>
                <th>Ativo</th>
                <th>Destaque</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {services.map((service) => (
                <tr key={service.id}>
                  <td data-label="Serviço">{service.name}</td>
                  <td data-label="Preço">{formatCurrency(service.price)}</td>
                  <td data-label="Duração">{service.duration_minutes} min</td>
                  <td data-label="Ativo">{service.active ? 'Sim' : 'Não'}</td>
                  <td data-label="Destaque">{service.featured ? 'Sim' : 'Não'}</td>
                  <td data-label="Ações">
                    <button className="admin-link-button" onClick={() => setEditing(service)} type="button">
                      Editar
                    </button>
                    <button className="admin-link-button danger" type="button" onClick={() => remove.mutate(service.id)}>
                      Desativar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <ServiceModal
          service={editing}
          onClose={() => setEditing(null)}
          onSave={(service) => {
            save.mutate(service);
            setEditing(null);
          }}
        />
      ) : null}
    </section>
  );
}

function ServiceModal({ service, onClose, onSave }: { service: AdminService; onClose: () => void; onSave: (service: AdminService) => void }) {
  const [draft, setDraft] = useState(service);

  return (
    <AdminModal title={draft.id ? 'Editar serviço' : 'Novo serviço'} onClose={onClose}>
      <div className="admin-form two-columns">
        <label>
          Nome
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </label>
        <label>
          Preço
          <input type="number" min="0" step="0.01" value={draft.price} onChange={(event) => setDraft({ ...draft, price: Number(event.target.value) })} />
        </label>
        <label>
          Duração
          <input type="number" min="1" value={draft.duration_minutes} onChange={(event) => setDraft({ ...draft, duration_minutes: Number(event.target.value) })} />
        </label>
        <label>
          Ordem
          <input type="number" value={draft.display_order || 0} onChange={(event) => setDraft({ ...draft, display_order: Number(event.target.value) })} />
        </label>
        <label className="wide">
          Descrição
          <textarea value={draft.description} onChange={(event) => setDraft({ ...draft, description: event.target.value })} />
        </label>
        <label>
          Status
          <select value={draft.active ? 'active' : 'inactive'} onChange={(event) => setDraft({ ...draft, active: event.target.value === 'active' })}>
            <option value="active">Ativo</option>
            <option value="inactive">Inativo</option>
          </select>
        </label>
        <label>
          Destaque
          <select value={draft.featured ? 'featured' : 'normal'} onChange={(event) => setDraft({ ...draft, featured: event.target.value === 'featured' })}>
            <option value="normal">Normal</option>
            <option value="featured">Destaque</option>
          </select>
        </label>
        <button className="admin-button primary wide" type="button" onClick={() => onSave(draft)}>
          Salvar serviço
        </button>
      </div>
    </AdminModal>
  );
}
