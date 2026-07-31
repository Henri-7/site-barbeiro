import { useState } from 'react';
import { useAvailability } from '../../hooks/useAvailability';
import type { AvailabilitySlot, SlotPeriod } from '../../types/availability';
import { Skeleton } from '../common/Skeleton';
import { TimeSlot } from './TimeSlot';

const periodLabels: Record<SlotPeriod, string> = {
  morning: 'Manhã',
  afternoon: 'Tarde',
  evening: 'Noite'
};

type TimeStepProps = {
  date: string | null;
  serviceId: string | null;
  selectedTime: string | null;
  onSelectTime: (slot: AvailabilitySlot) => void;
  onSelectDate: (date: string) => void;
  onChooseAnotherDate: () => void;
};

export function TimeStep({ date, serviceId, selectedTime, onSelectTime, onSelectDate, onChooseAnotherDate }: TimeStepProps) {
  const { availability, isLoading, error, reload } = useAvailability(date, serviceId);
  const [onlyAvailable, setOnlyAvailable] = useState(true);

  if (!date || !serviceId) {
    return <div className="empty-state">Escolha um serviço e uma data para ver horários.</div>;
  }

  const grouped = availability?.grouped;
  const hasAvailable = availability?.slots.some((slot) => slot.status === 'available');

  return (
    <div className="step-panel">
      <div className="step-heading-row">
        <h3>Escolha o horário</h3>
        <label className="toggle-row">
          Horários
          <select className="time-filter-select" value={onlyAvailable ? 'available' : 'all'} onChange={(event) => setOnlyAvailable(event.target.value === 'available')}>
            <option value="available">Somente disponíveis</option>
            <option value="all">Todos</option>
          </select>
        </label>
      </div>
      {isLoading ? <Skeleton lines={4} /> : null}
      {error ? (
        <div className="empty-state">
          <p>{error}</p>
          <div className="closed-day-actions">
            <button className="btn btn-primary" type="button" onClick={onChooseAnotherDate}>
              Escolher outra data
            </button>
            <button className="btn btn-secondary" type="button" onClick={reload}>
              Recarregar horários
            </button>
          </div>
        </div>
      ) : null}
      {!isLoading && availability && !hasAvailable ? (
        <div className="empty-state">
          <p>A barbearia estará fechada ou sem horários disponíveis nesse dia.</p>
          <div className="closed-day-actions">
            <button className="btn btn-primary" type="button" onClick={onChooseAnotherDate}>
              Escolher outra data
            </button>
            {availability.nextAvailableDate ? (
              <button className="btn btn-secondary" type="button" onClick={() => onSelectDate(availability.nextAvailableDate!)}>
                Ver próximo dia disponível
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
      {grouped
        ? (Object.keys(grouped) as SlotPeriod[]).map((period) => {
            const slots = onlyAvailable ? grouped[period].filter((slot) => slot.status === 'available') : grouped[period];
            if (slots.length === 0) return null;
            return (
              <div className="period-group" key={period}>
                <h4>{periodLabels[period]}</h4>
                <div className="time-grid">
                  {slots.map((slot) => (
                    <TimeSlot key={slot.time} slot={slot} selected={selectedTime === slot.time} onSelect={onSelectTime} />
                  ))}
                </div>
              </div>
            );
          })
        : null}
    </div>
  );
}
