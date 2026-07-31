import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Plus } from 'lucide-react';
import { useState } from 'react';
import { AdminModal } from '../components/common/AdminModal';
import { AdminEmpty, AdminError, AdminLoading } from '../components/common/AdminState';
import { queryKeys } from '../lib/queryKeys';
import { adminRequest, exportCsv } from '../services/adminApi';
import { buildWhatsAppUrl } from '../../utils/whatsapp';

type Customer = { id?: string; name: string; phone: string; notes?: string; active: boolean };

const blank: Customer = { name: '', phone: '', notes: '', active: true };

export function AdminCustomersPage() {
  const [editing, setEditing] = useState<Customer | null>(null);
  const client = useQueryClient();

  const query = useQuery({
    queryKey: queryKeys.customers,
    queryFn: () => adminRequest<Customer[]>('/customers'),
  });

  const save = useMutation({
    mutationFn: (customer: Customer) =>
      adminRequest<Customer>(customer.id ? `/customers/${customer.id}` : '/customers', {
        method: customer.id ? 'PATCH' : 'POST',
        body: JSON.stringify(customer),
      }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.customers }),
  });

  if (query.isLoading) return <AdminLoading />;
  if (query.isError) return <AdminError text="Não foi possível carregar clientes." />;

  const rows = query.data || [];

  return (
    <section className="admin-card">
      <div className="admin-section-title">
        <h2>Clientes</h2>
        <div className="admin-actions">
          <button className="admin-button secondary" type="button" onClick={() => exportCsv('clientes.csv', rows)}>
            <Download size={17} />
            CSV
          </button>
          <button className="admin-button primary" type="button" onClick={() => setEditing(blank)}>
            <Plus size={17} />
            Novo cliente
          </button>
        </div>
      </div>

      {rows.length === 0 ? (
        <AdminEmpty />
      ) : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Telefone</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((customer) => (
                <tr key={customer.id}>
                  <td data-label="Nome">{customer.name}</td>
                  <td data-label="Telefone">{customer.phone}</td>
                  <td data-label="Ações">
                    <a className="admin-link-button" href={buildWhatsAppUrl()} target="_blank" rel="noopener noreferrer">
                      WhatsApp
                    </a>
                    <button className="admin-link-button" type="button" onClick={() => setEditing(customer)}>
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing ? (
        <CustomerModal
          customer={editing}
          onClose={() => setEditing(null)}
          onSave={(customer) => {
            save.mutate(customer);
            setEditing(null);
          }}
        />
      ) : null}
    </section>
  );
}

function CustomerModal({
  customer,
  onClose,
  onSave,
}: {
  customer: Customer;
  onClose: () => void;
  onSave: (customer: Customer) => void;
}) {
  const [draft, setDraft] = useState(customer);

  return (
    <AdminModal title="Cliente" onClose={onClose}>
      <div className="admin-form">
        <label>
          Nome
          <input value={draft.name} onChange={(event) => setDraft({ ...draft, name: event.target.value })} />
        </label>
        <label>
          Telefone
          <input value={draft.phone} onChange={(event) => setDraft({ ...draft, phone: event.target.value })} />
        </label>
        <label>
          Observações
          <textarea value={draft.notes || ''} onChange={(event) => setDraft({ ...draft, notes: event.target.value })} />
        </label>
        <button className="admin-button primary" type="button" onClick={() => onSave(draft)}>
          Salvar cliente
        </button>
      </div>
    </AdminModal>
  );
}
