import type { Service } from '../types/service';
import { apiRequest } from './api';

type ApiService = Omit<Service, 'durationMinutes'> & {
  duration_minutes: number;
};

export async function fetchServices() {
  const services = await apiRequest<ApiService[]>('/public/services');
  return services.map((service) => ({
    ...service,
    durationMinutes: service.duration_minutes
  }));
}
