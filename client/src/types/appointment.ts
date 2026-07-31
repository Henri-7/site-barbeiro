import type { Service } from './service';

export type BookingState = {
  service: Service | null;
  date: string | null;
  startTime: string | null;
  endTime: string | null;
  customerName: string;
  customerPhone: string;
  notes: string;
  currentStep: number;
};

export type AppointmentSummary = {
  service: string;
  price: number;
  durationMinutes: number;
  appointmentDate: string;
  startTime: string;
  endTime: string;
  customerName: string;
  customerPhone: string;
  notes?: string;
};

export type AppointmentResult = {
  appointment: unknown;
  service: Service;
  summary: AppointmentSummary;
  whatsappLink?: string;
  whatsappNotification?: {
    status: 'disabled' | 'sent' | 'failed';
    provider: string;
    messageId?: string | null;
    reason?: string;
  };
};
