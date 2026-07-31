import { apiRequest } from './api';

export type BlockedDate = {
  id: string;
  blocked_date?: string;
  start_date?: string;
  end_date?: string;
  reason: string | null;
  all_day: boolean;
  start_time: string | null;
  end_time: string | null;
};

export function fetchBlockedDates(start: string, end: string) {
  const query = new URLSearchParams({ start, end });
  return apiRequest<BlockedDate[]>(`/blocked-dates?${query.toString()}`);
}
