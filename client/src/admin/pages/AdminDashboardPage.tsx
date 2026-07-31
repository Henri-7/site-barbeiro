import { useQuery } from '@tanstack/react-query';
import { CalendarPlus, ImagePlus, Lock, Scissors } from 'lucide-react';
import { AdminEmpty, AdminError, AdminLoading } from '../components/common/AdminState';
import { queryKeys } from '../lib/queryKeys';
import { adminRequest } from '../services/adminApi';
import { formatCurrency } from '../../utils/currency';
import { formatAppointmentStatus } from '../utils/appointmentStatus';

type DashboardData = {
  cards: Record<string, number>;
  todayAgenda: Array<Record<string, string | number | null>>;
  nextAppointment: Record<string, string | number | null> | null;
  charts: {
    lastSevenDays: Array<{ date: string; total: number }>;
    services: Array<{ name: string; total: number }>;
    statuses: Array<{ status: string; total: number }>;
  };
  recentActivity: Array<Record<string, string>>;
};

export function AdminDashboardPage() {
  const query = useQuery({ queryKey: queryKeys.dashboard, queryFn: () => adminRequest<DashboardData>('/dashboard') });
  if (query.isLoading) return <AdminLoading />;
  if (query.isError) return <AdminError text="Não foi possível carregar o dashboard." onRetry={() => void query.refetch()} />;
  if (!query.data?.cards) return <AdminError text="Dashboard sem dados. Verifique se o usuário existe em admin_profiles e se as migrations foram executadas." onRetry={() => void query.refetch()} />;
  const data = query.data;
  const cards = [
    ['Hoje', data.cards.today],
    ['Pendentes', data.cards.pending],
    ['Confirmados', data.cards.confirmed],
    ['Cancelados', data.cards.cancelled],
    ['Concluídos', data.cards.completed],
    ['Receita do dia', formatCurrency(data.cards.dayRevenue || 0)],
    ['Receita do mês', formatCurrency(data.cards.monthRevenue || 0)]
  ];

  return (
    <div className="admin-page-grid">
      <section className="admin-kpi-grid">
        {cards.map(([label, value]) => <article className="admin-kpi" key={label}><span>{label}</span><strong>{value}</strong></article>)}
      </section>
      <section className="admin-card">
        <div className="admin-section-title">
          <h2>Agenda de hoje</h2>
          <a className="admin-button secondary" href="/admin/agenda">Abrir agenda</a>
        </div>
        {data.todayAgenda.length === 0 ? <AdminEmpty text="Nenhum agendamento para hoje." /> : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead><tr><th>Horário</th><th>Cliente</th><th>Telefone</th><th>Status</th></tr></thead>
              <tbody>{data.todayAgenda.map((item) => {
                const status = String(item.status || '');
                return (
                  <tr key={String(item.id)}>
                    <td data-label="Horário">{item.start_time}</td>
                    <td data-label="Cliente">{item.customer_name}</td>
                    <td data-label="Telefone">{item.customer_phone}</td>
                    <td data-label="Status"><span className={`admin-status ${status}`}>{formatAppointmentStatus(status)}</span></td>
                  </tr>
                );
              })}</tbody>
            </table>
          </div>
        )}
      </section>
      <section className="admin-card">
        <h2>Ações rápidas</h2>
        <div className="admin-quick-actions">
          <a className="admin-button primary" href="/admin/agendamentos"><CalendarPlus size={17} />Novo agendamento</a>
          <a className="admin-button secondary" href="/admin/bloqueios"><Lock size={17} />Bloquear horário</a>
          <a className="admin-button secondary" href="/admin/servicos"><Scissors size={17} />Criar serviço</a>
          <a className="admin-button secondary" href="/admin/galeria"><ImagePlus size={17} />Adicionar foto</a>
        </div>
      </section>
      <section className="admin-card">
        <h2>Gráficos simples</h2>
        <div className="admin-chart-grid">
          {data.charts.lastSevenDays.map((item) => <div key={item.date}><span>{item.date.slice(5)}</span><strong style={{ height: `${Math.max(item.total * 20, 8)}px` }} /></div>)}
        </div>
      </section>
      <section className="admin-card">
        <h2>Atividades recentes</h2>
        {data.recentActivity.length === 0 ? <AdminEmpty text="Nenhuma atividade registrada." /> : data.recentActivity.map((item) => <p key={item.id}>{item.action} em {item.entity_type}</p>)}
      </section>
    </div>
  );
}
