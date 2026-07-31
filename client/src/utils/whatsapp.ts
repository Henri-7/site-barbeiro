import type { AppointmentSummary } from '../types/appointment';
import { formatCurrency } from './currency';
import { formatShortDate } from './date';

const barbershopWhatsAppPhone = '5535984752062';

type CustomerConfirmation = {
  customerName?: string;
  service?: string;
  appointmentDate?: string;
  startTime?: string;
  endTime?: string;
  durationMinutes?: number;
  price?: number;
  address?: string;
};

function normalizeWhatsAppPhone(value: string) {
  const digits = String(value || '').replace(/\D/g, '');

  if (!digits) return '';
  if (digits.startsWith('55')) return digits;

  return `55${digits}`;
}

export function buildWhatsAppMessage(appointment?: AppointmentSummary) {
  if (!appointment) {
    return 'Olá! Gostaria de agendar um horário na Barbearia Elite.';
  }

  const notes = appointment.notes ? `Observações: ${appointment.notes}` : null;
  return [
    'Olá! Tenho um corte agendado na Barbearia Elite.',
    '',
    `Nome: ${appointment.customerName}`,
    `Telefone: ${appointment.customerPhone}`,
    `Atendimento: ${appointment.service}`,
    `Data: ${formatShortDate(appointment.appointmentDate)}`,
    `Horário: ${appointment.startTime} às ${appointment.endTime}`,
    `Duração: ${appointment.durationMinutes} minutos`,
    `Valor: ${formatCurrency(appointment.price)}`,
    notes,
    '',
    'Estou confirmando meu horário por aqui.'
  ]
    .filter(Boolean)
    .join('\n');
}

export function buildCustomerConfirmationMessage(appointment: CustomerConfirmation) {
  const lines = [
    `Olá${appointment.customerName ? `, ${appointment.customerName}` : ''}! Seu horário na Barbearia Elite foi agendado.`,
    '',
    appointment.service ? `Serviço: ${appointment.service}` : null,
    appointment.appointmentDate ? `Data: ${formatShortDate(appointment.appointmentDate)}` : null,
    appointment.startTime && appointment.endTime ? `Horário: ${appointment.startTime} às ${appointment.endTime}` : null,
    appointment.durationMinutes ? `Duração: ${appointment.durationMinutes} minutos` : null,
    appointment.price ? `Valor: ${formatCurrency(appointment.price)}` : null,
    `Local: ${appointment.address || 'Endereço a definir'}`,
    '',
    'Te esperamos no horário marcado.'
  ];

  return lines.filter(Boolean).join('\n');
}

export function buildWhatsAppUrl(appointment?: AppointmentSummary) {
  return `https://wa.me/${barbershopWhatsAppPhone}?text=${encodeURIComponent(buildWhatsAppMessage(appointment))}`;
}

export function buildCustomerWhatsAppUrl(phone: string, appointment: CustomerConfirmation) {
  const normalizedPhone = normalizeWhatsAppPhone(phone);

  if (!normalizedPhone) return '';

  return `https://wa.me/${normalizedPhone}?text=${encodeURIComponent(buildCustomerConfirmationMessage(appointment))}`;
}
