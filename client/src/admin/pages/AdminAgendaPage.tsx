import { useQuery } from '@tanstack/react-query';
import { addDays, format } from 'date-fns';
import { useState } from 'react';
import { AdminEmpty, AdminError, AdminLoading } from '../components/common/AdminState';
import { queryKeys } from '../lib/queryKeys';
import { adminRequest } from '../services/adminApi';
import { formatAppointmentStatus } from '../utils/appointmentStatus';

type Appointment = {
  id: string;
  appointment_date: string;
  start_time: string;
  end_time: string;
  customer_name: string;
  status: string;
};
type PageData = { items: Appointment[] };

export function AdminAgendaPage() {
  const [date, setDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const query = useQuery({ queryKey: [...queryKeys.appointments, 'agenda', date], queryFn: () => adminRequest<PageData>(`/appointments?date=${date}&pageSize=100`) });
  if (query.isLoading) return <AdminLoading />;
  if (query.isError) return <AdminError text="Não foi possível carregar a agenda." onRetry={() => void query.refetch()} />;
  const rows = query.data?.items || [];

  return (
    <section className="admin-card">
      <div className="admin-section-title">
        <h2>Agenda</h2>
        <div className="admin-actions">
          <button className="admin-button secondary" type="button" onClick={() => setDate(format(new Date(), 'yyyy-MM-dd'))}>Hoje</button>
          <button className="admin-button secondary" type="button" onClick={() => setDate(format(addDays(new Date(`${date}T00:00:00`), -1), 'yyyy-MM-dd'))}>Anterior</button>
          <input type="date" value={date} onChange={(event) => setDate(event.target.value)} />
          <button className="admin-button secondary" type="button" onClick={() => setDate(format(addDays(new Date(`${date}T00:00:00`), 1), 'yyyy-MM-dd'))}>Próximo</button>
        </div>
      </div>
      <div className="admin-agenda-list">
        {rows.length === 0 ? <AdminEmpty text="Nenhum atendimento para esta data." /> : rows.map((item) => (
          <article key={item.id} className={`admin-agenda-item ${item.status}`}>
            <strong>{item.start_time} - {item.end_time}</strong>
            <span>{item.customer_name}</span>
            <em>{formatAppointmentStatus(item.status)}</em>
          </article>
        ))}
      </div>
    </section>
  );
}
