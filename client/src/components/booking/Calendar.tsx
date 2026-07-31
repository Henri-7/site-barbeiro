import { addMonths, format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useBlockedDates } from '../../hooks/useBlockedDates';
import { useBusinessHours } from '../../hooks/useBusinessHours';
import { getMonthMatrix, isBeyondLimit, isPastDate, isToday, toDateInput } from '../../utils/date';

const dayNames = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
const recurringBlockedDates = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'];

type CalendarProps = {
  selectedDate: string | null;
  onSelectDate: (date: string) => void;
};

export function Calendar({ selectedDate, onSelectDate }: CalendarProps) {
  const [monthDate, setMonthDate] = useState(() => startOfMonth(new Date()));
  const blockedDates = useBlockedDates(monthDate);
  const businessHours = useBusinessHours();
  const cells = useMemo(() => getMonthMatrix(monthDate), [monthDate]);
  const openWeekdays = useMemo(() => {
    if (!businessHours) return null;

    return new Set(businessHours.filter((hour) => hour.active !== false).map((hour) => Number(hour.weekday)));
  }, [businessHours]);
  const currentMonth = startOfMonth(new Date());
  const canGoPrevious = monthDate > currentMonth;

  return (
    <div className="calendar-card">
      <div className="calendar-header">
        <button type="button" className="icon-button" aria-label="Mês anterior" disabled={!canGoPrevious} onClick={() => setMonthDate((current) => addMonths(current, -1))}>
          <ChevronLeft size={18} />
        </button>
        <h3>{format(monthDate, 'MMMM yyyy', { locale: ptBR })}</h3>
        <button type="button" className="icon-button" aria-label="Próximo mês" onClick={() => setMonthDate((current) => addMonths(current, 1))}>
          <ChevronRight size={18} />
        </button>
      </div>
      <div className="calendar-grid" role="grid" aria-label="Calendário de agendamento">
        {dayNames.map((day) => (
          <span key={day} className="calendar-day-name" role="columnheader">
            {day}
          </span>
        ))}
        {cells.map((date, index) => {
          if (!date) return <span key={`empty-${index}`} />;
          const value = toDateInput(date);
          const monthDay = value.slice(5);
          const blocked = blockedDates.includes(value) || recurringBlockedDates.includes(monthDay);
          const closedByBusinessHours = openWeekdays ? !openWeekdays.has(date.getDay()) : date.getDay() === 0;
          const disabled = isPastDate(date) || isBeyondLimit(date) || closedByBusinessHours || blocked;
          return (
            <button
              key={value}
              type="button"
              className={`${selectedDate === value ? 'is-selected' : ''} ${isToday(date) ? 'is-today' : ''}`}
              disabled={disabled}
              aria-selected={selectedDate === value}
              aria-label={`${format(date, 'dd/MM/yyyy')}${disabled ? ' indisponível' : ' disponível'}`}
              onClick={() => onSelectDate(value)}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
