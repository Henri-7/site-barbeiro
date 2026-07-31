import { useQuery } from '@tanstack/react-query';
import { useParams } from 'react-router-dom';
import { adminRequest } from '../services/adminApi';
import { AdminError, AdminLoading } from '../components/common/AdminState';
import { formatAppointmentStatus } from '../utils/appointmentStatus';

export function AdminAppointmentDetailsPage() {
  const { id } = useParams<{ id: string }>();
  const query = useQuery({ queryKey: ['appointment', id], queryFn: () => adminRequest<Record<string, string>>(`/appointments/${id}`) });
  if (query.isLoading) return <AdminLoading />;
  if (query.isError) return <AdminError text="Agendamento não encontrado." />;
  const appointment = query.data!;
  return (
    <section className="admin-card">
      <h2>Detalhes do agendamento</h2>
      <dl className="admin-details">
        {Object.entries(appointment).map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{key === 'status' ? formatAppointmentStatus(String(value || '')) : String(value ?? '-')}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
