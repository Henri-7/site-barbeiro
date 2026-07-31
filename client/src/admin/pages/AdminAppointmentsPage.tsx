import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Download } from 'lucide-react';
import { useState } from 'react';
import { AdminModal } from '../components/common/AdminModal';
import { AdminEmpty, AdminError, AdminLoading } from '../components/common/AdminState';
import { queryKeys } from '../lib/queryKeys';
import { adminRequest, exportCsv } from '../services/adminApi';
import { appointmentStatuses, formatAppointmentStatus } from '../utils/appointmentStatus';

type Appointment = {
  id: string;
  customer_name: string;
  customer_phone: string;
  service_id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  status: string;
  notes?: string;
};

type PageData = { items: Appointment[]; total: number; page: number; pageSize: number };

export function AdminAppointmentsPage() {
  const [status, setStatus] = useState('');
  const [search, setSearch] = useState('');
  const [editing, setEditing] = useState<Appointment | null>(null);
  const client = useQueryClient();
  const query = useQuery({ queryKey: [...queryKeys.appointments, status, search], queryFn: () => adminRequest<PageData>(`/appointments?status=${status}&search=${encodeURIComponent(search)}`) });
  const update = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Partial<Appointment> }) => adminRequest<Appointment>(`/appointments/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.appointments })
  });

  if (query.isLoading) return <AdminLoading />;
  if (query.isError) return <AdminError text="Não foi possível carregar agendamentos." onRetry={() => void query.refetch()} />;
  const rows = query.data?.items || [];

  return (
    <section className="admin-card">
      <div className="admin-section-title">
        <h2>Agendamentos</h2>
        <button className="admin-button secondary" type="button" onClick={() => exportCsv('agendamentos.csv', rows)}><Download size={17} />CSV</button>
      </div>
      <div className="admin-filters">
        <input placeholder="Buscar nome, telefone ou ID" value={search} onChange={(event) => setSearch(event.target.value)} />
        <select value={status} onChange={(event) => setStatus(event.target.value)}>
          <option value="">Todos os status</option>
          {appointmentStatuses.map((item) => <option value={item} key={item}>{formatAppointmentStatus(item)}</option>)}
        </select>
        <button className="admin-button secondary" type="button" onClick={() => { setStatus(''); setSearch(''); }}>Limpar filtros</button>
      </div>
      {rows.length === 0 ? <AdminEmpty /> : (
        <div className="admin-table-wrap">
          <table className="admin-table">
            <thead><tr><th>Data</th><th>Horário</th><th>Cliente</th><th>Telefone</th><th>Status</th><th>Ações</th></tr></thead>
            <tbody>{rows.map((item) => (
              <tr key={item.id}>
                <td data-label="Data">{item.appointment_date}</td>
                <td data-label="Horário">{item.start_time}</td>
                <td data-label="Cliente">{item.customer_name}</td>
                <td data-label="Telefone">{item.customer_phone}</td>
                <td data-label="Status"><span className={`admin-status ${item.status}`}>{formatAppointmentStatus(item.status)}</span></td>
                <td data-label="Ações"><button className="admin-link-button" type="button" onClick={() => setEditing(item)}>Editar</button></td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      )}
      {editing ? (
        <AdminModal title="Gerenciar agendamento" onClose={() => setEditing(null)}>
          <div className="admin-form">
            <label>Status
              <select value={editing.status} onChange={(event) => setEditing({ ...editing, status: event.target.value })}>
                {appointmentStatuses.map((item) => <option key={item} value={item}>{formatAppointmentStatus(item)}</option>)}
              </select>
            </label>
            <label>Observações
              <textarea value={editing.notes || ''} onChange={(event) => setEditing({ ...editing, notes: event.target.value })} />
            </label>
            <button className="admin-button primary" type="button" onClick={() => { update.mutate({ id: editing.id, body: { status: editing.status, notes: editing.notes } }); setEditing(null); }}>Salvar</button>
          </div>
        </AdminModal>
      ) : null}
    </section>
  );
}
