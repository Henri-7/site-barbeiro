import { endOfMonth, format, startOfMonth } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';
import { fetchBlockedDates } from '../services/blockedDates.api';

export function useBlockedDates(monthDate: Date) {
  const [blockedDates, setBlockedDates] = useState<string[]>([]);

  const range = useMemo(
    () => ({
      start: format(startOfMonth(monthDate), 'yyyy-MM-dd'),
      end: format(endOfMonth(monthDate), 'yyyy-MM-dd')
    }),
    [monthDate]
  );

  useEffect(() => {
    let active = true;
    fetchBlockedDates(range.start, range.end)
      .then((items) => {
        if (active) {
          setBlockedDates(
            items
              .filter((item) => item.all_day)
              .flatMap((item) => expandRange(item.start_date || item.blocked_date || '', item.end_date || item.blocked_date || ''))
          );
        }
      })
      .catch(() => {
        if (active) setBlockedDates([]);
      });

    return () => {
      active = false;
    };
  }, [range.start, range.end]);

  return blockedDates;
}

function expandRange(start: string, end: string) {
  if (!start || !end) return [];
  const dates: string[] = [];
  const current = new Date(`${start}T00:00:00`);
  const last = new Date(`${end}T00:00:00`);
  while (current <= last) {
    dates.push(format(current, 'yyyy-MM-dd'));
    current.setDate(current.getDate() + 1);
  }
  return dates;
}
