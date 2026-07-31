import { addDays, format, isBefore, isSameDay, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function toDateInput(date: Date) {
  return format(date, 'yyyy-MM-dd');
}

export function formatLongDate(value: string) {
  return format(parseISO(`${value}T00:00:00`), "dd 'de' MMMM 'de' yyyy", { locale: ptBR });
}

export function formatShortDate(value: string) {
  return format(parseISO(`${value}T00:00:00`), 'dd/MM/yyyy', { locale: ptBR });
}

export function getMonthMatrix(monthDate: Date) {
  const first = new Date(monthDate.getFullYear(), monthDate.getMonth(), 1);
  const daysInMonth = new Date(monthDate.getFullYear(), monthDate.getMonth() + 1, 0).getDate();
  const cells: Array<Date | null> = Array.from({ length: first.getDay() }, () => null);

  for (let day = 1; day <= daysInMonth; day += 1) {
    cells.push(new Date(monthDate.getFullYear(), monthDate.getMonth(), day));
  }

  return cells;
}

export function isPastDate(date: Date) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const candidate = new Date(date);
  candidate.setHours(0, 0, 0, 0);
  return isBefore(candidate, today);
}

export function isBeyondLimit(date: Date, maxAdvanceDays = 60) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return date > addDays(today, maxAdvanceDays);
}

export function isToday(date: Date) {
  return isSameDay(date, new Date());
}
