import type { AvailabilityResponse } from '../types/availability';
import { apiRequest } from './api';

export function fetchAvailability(date: string, serviceId: string) {
  const query = new URLSearchParams({ date, serviceId });
  return apiRequest<AvailabilityResponse>(`/availability?${query.toString()}`);
}
