import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { AdminError, AdminLoading } from '../components/common/AdminState';
import { queryKeys } from '../lib/queryKeys';
import { adminRequest } from '../services/adminApi';

type Hour = { id?: string; weekday: number; start_time: string; end_time: string; active: boolean };

const week = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado'];

function normalizeTime(time: string) {
  return String(time || '').slice(0, 5);
}

function isSameHour(first: Hour, second: Hour) {
  if (first.id && second.id) return first.id === second.id;

  return first.weekday === second.weekday && normalizeTime(first.start_time) === normalizeTime(second.start_time);
}

export function AdminBusinessHoursPage() {
  const client = useQueryClient();
  const [saveError, setSaveError] = useState<string | null>(null);
  const query = useQuery({ queryKey: queryKeys.businessHours, queryFn: () => adminRequest<Hour[]>('/business-hours') });
  const save = useMutation({
    mutationFn: (hour: Hour) =>
      adminRequest<Hour>(`/business-hours/${hour.id || hour.weekday}`, {
        method: 'PATCH',
        body: JSON.stringify(hour),
      }),
    onMutate: async (hour) => {
      setSaveError(null);
      await client.cancelQueries({ queryKey: queryKeys.businessHours });
      const previous = client.getQueryData<Hour[]>(queryKeys.businessHours);

      client.setQueryData<Hour[]>(queryKeys.businessHours, (current = []) =>
        current.map((item) => (isSameHour(item, hour) ? { ...item, ...hour } : item))
      );

      return { previous };
    },
    onError: (error, _hour, context) => {
      if (context?.previous) client.setQueryData(queryKeys.businessHours, context.previous);
      setSaveError((error as Error).message || 'Não foi possível salvar o horário.');
    },
    onSettled: () => client.invalidateQueries({ queryKey: queryKeys.businessHours }),
  });

  if (query.isLoading) return <AdminLoading />;
  if (query.isError) return <AdminError text="Não foi possível carregar horários." onRetry={() => void query.refetch()} />;

  return (
    <section className="admin-card">
      <h2>Horários de funcionamento</h2>
      {saveError ? <p className="admin-alert" role="alert">{saveError}</p> : null}
      <div className="admin-hour-grid">
        {(query.data || []).map((hour) => (
          <HourRow key={hour.id || `${hour.weekday}-${hour.start_time}-${hour.end_time}`} hour={hour} onSave={(next) => save.mutate(next)} />
        ))}
      </div>
    </section>
  );
}

function HourRow({ hour, onSave }: { hour: Hour; onSave: (hour: Hour) => void }) {
  const normalizedHour = {
    ...hour,
    start_time: normalizeTime(hour.start_time),
    end_time: normalizeTime(hour.end_time),
  };
  const update = (patch: Partial<Hour>) => onSave({ ...normalizedHour, ...patch });
  const period = normalizedHour.start_time < '12:00' ? 'Manhã' : normalizedHour.start_time < '18:00' ? 'Tarde' : 'Noite';

  return (
    <article className="admin-hour-row">
      <strong>
        {week[normalizedHour.weekday]}
        <span>{period}</span>
      </strong>
      <label>
        Status
        <select value={normalizedHour.active ? 'active' : 'inactive'} onChange={(event) => update({ active: event.target.value === 'active' })}>
          <option value="active">Aberto</option>
          <option value="inactive">Fechado</option>
        </select>
      </label>
      <input type="time" value={normalizedHour.start_time} onChange={(event) => update({ start_time: event.target.value })} />
      <input type="time" value={normalizedHour.end_time} onChange={(event) => update({ end_time: event.target.value })} />
    </article>
  );
}
