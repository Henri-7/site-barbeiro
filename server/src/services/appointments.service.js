import { recurringBlockedDates } from '../data.seed.js';
import { createAppointment, listAppointmentsByDate } from '../repositories/appointments.repository.js';
import { listBlockedDates } from '../repositories/blockedDates.repository.js';
import { getBusinessHoursByWeekday } from '../repositories/businessHours.repository.js';
import { getBookingSettings } from '../repositories/bookingSettings.repository.js';
import { findServiceById } from '../repositories/services.repository.js';
import { isValidDateString, toLocalDate } from '../utils/date.js';
import { isValidBrazilianPhone } from '../utils/phone.js';
import { buildAvailability, calculateEndTime } from '../utils/timeSlots.js';
import { findNextAvailableDate } from './availability.service.js';
import { buildAppointmentConfirmationUrl, sendAppointmentConfirmation } from './whatsapp.service.js';

function cleanText(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function validateAppointmentPayload(payload) {
  const errors = [];
  const customerName = cleanText(payload.customerName);
  const customerPhone = cleanText(payload.customerPhone);
  const notes = cleanText(payload.notes || '');

  if (customerName.length < 3 || customerName.length > 100) {
    errors.push('Nome deve ter entre 3 e 100 caracteres.');
  }
  if (!isValidBrazilianPhone(customerPhone)) {
    errors.push('Telefone inválido. Use DDD e celular brasileiro.');
  }
  if (!payload.serviceId) {
    errors.push('Escolha um serviço.');
  }
  if (!isValidDateString(payload.appointmentDate)) {
    errors.push('Informe uma data valida.');
  }
  if (!/^\d{2}:\d{2}$/.test(payload.startTime || '')) {
    errors.push('Escolha um horário valido.');
  }
  if (notes.length > 280) {
    errors.push('Observações devem ter no máximo 280 caracteres.');
  }

  if (errors.length > 0) {
    const error = new Error(errors[0]);
    error.status = 400;
    error.code = 'VALIDATION_ERROR';
    throw error;
  }

  return { customerName, customerPhone, notes };
}

export async function requestAppointment(payload) {
  const cleaned = validateAppointmentPayload(payload);
  const service = await findServiceById(payload.serviceId);

  if (!service) {
    const error = new Error('Serviço não encontrado.');
    error.status = 404;
    error.code = 'SERVICE_NOT_FOUND';
    throw error;
  }

  const selectedDate = toLocalDate(payload.appointmentDate);
  const businessHours = await getBusinessHoursByWeekday(selectedDate.getDay());
  const appointments = await listAppointmentsByDate(payload.appointmentDate);
  const blockedDates = await listBlockedDates(payload.appointmentDate, payload.appointmentDate);
  const settings = await getBookingSettings();
  const slots = buildAvailability({
    date: payload.appointmentDate,
    service,
    businessHours,
    appointments,
    blockedDates,
    recurringBlockedDates,
    config: settings
  });
  const selectedSlot = slots.find((slot) => slot.time === payload.startTime);

  if (!selectedSlot || selectedSlot.status !== 'available') {
    const suggestions = slots.filter((slot) => slot.status === 'available').slice(0, 3).map((slot) => slot.time);
    const error = new Error('Esse horário não está mais disponível.');
    error.status = 409;
    error.code = 'SLOT_UNAVAILABLE';
    error.details = {
      suggestions,
      nextAvailableDate: suggestions.length > 0 ? null : await findNextAvailableDate(payload.appointmentDate, service)
    };
    throw error;
  }

  const endTime = calculateEndTime(payload.startTime, service.duration_minutes);
  const appointment = await createAppointment({
    customer_name: cleaned.customerName,
    customer_phone: cleaned.customerPhone,
    service_id: service.id,
    appointment_date: payload.appointmentDate,
    start_time: payload.startTime,
    end_time: endTime,
    notes: cleaned.notes || null,
    service_name_snapshot: service.name,
    service_price_snapshot: service.price,
    service_duration_snapshot: service.duration_minutes,
    source: 'site'
  });
  const summary = {
    service: service.name,
    price: service.price,
    durationMinutes: service.duration_minutes,
    appointmentDate: payload.appointmentDate,
    startTime: payload.startTime,
    endTime,
    customerName: cleaned.customerName,
    customerPhone: cleaned.customerPhone,
    notes: cleaned.notes
  };
  let whatsappNotification;
  const whatsappLink = await buildAppointmentConfirmationUrl(summary);

  try {
    whatsappNotification = await sendAppointmentConfirmation(summary);
  } catch (error) {
    console.warn('Agendamento salvo, mas o WhatsApp automático falhou.', error.message);
    whatsappNotification = {
      status: 'failed',
      provider: 'whatsapp_cloud_api',
      reason: error.message
    };
  }

  return {
    appointment,
    service,
    summary,
    whatsappNotification,
    whatsappLink
  };
}
