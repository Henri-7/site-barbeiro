import type { AppointmentResult } from '../types/appointment';
import { apiRequest } from './api';

type AppointmentPayload = {
  serviceId: string;
  appointmentDate: string;
  startTime: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
};

export function createAppointment(payload: AppointmentPayload) {
  return apiRequest<AppointmentResult>('/public/appointments', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}
