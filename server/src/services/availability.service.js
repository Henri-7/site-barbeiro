import { recurringBlockedDates } from '../data.seed.js';
import { listAppointmentsByDate } from '../repositories/appointments.repository.js';
import { listBlockedDates } from '../repositories/blockedDates.repository.js';
import { getBusinessHoursByWeekday } from '../repositories/businessHours.repository.js';
import { getBookingSettings } from '../repositories/bookingSettings.repository.js';
import { findServiceById } from '../repositories/services.repository.js';
import { addDays, formatDate, isValidDateString, toLocalDate } from '../utils/date.js';
import { bookingConfig, buildAvailability, groupAvailability } from '../utils/timeSlots.js';

export async function getAvailability(date, serviceId) {
  if (!isValidDateString(date)) {
    const error = new Error('Informe uma data valida no formato YYYY-MM-DD.');
    error.status = 400;
    error.code = 'INVALID_DATE';
    throw error;
  }

  const service = await findServiceById(serviceId);
  if (!service) {
    const error = new Error('Serviço não encontrado.');
    error.status = 404;
    error.code = 'SERVICE_NOT_FOUND';
    throw error;
  }

  const selectedDate = toLocalDate(date);
  const businessHours = await getBusinessHoursByWeekday(selectedDate.getDay());
  const appointments = await listAppointmentsByDate(date);
  const blockedDates = await listBlockedDates(date, date);
  const settings = await getBookingSettings();
  const slots = buildAvailability({
    date,
    service,
    businessHours,
    appointments,
    blockedDates,
    recurringBlockedDates,
    config: settings
  });
  const nextAvailableDate = slots.some((slot) => slot.status === 'available')
    ? null
    : await findNextAvailableDate(date, service);

  return {
    date,
    serviceId,
    config: settings || bookingConfig,
    slots,
    grouped: groupAvailability(slots),
    nextAvailableDate
  };
}

export async function findNextAvailableDate(fromDate, service) {
  const start = toLocalDate(fromDate);

  for (let offset = 1; offset <= bookingConfig.maxAdvanceDays; offset += 1) {
    const candidate = formatDate(addDays(start, offset));
    const candidateDate = toLocalDate(candidate);
    const businessHours = await getBusinessHoursByWeekday(candidateDate.getDay());
    const appointments = await listAppointmentsByDate(candidate);
    const blockedDates = await listBlockedDates(candidate, candidate);
    const settings = await getBookingSettings();
    const slots = buildAvailability({
      date: candidate,
      service,
      businessHours,
      appointments,
      blockedDates,
      recurringBlockedDates,
      config: settings
    });

    if (slots.some((slot) => slot.status === 'available')) {
      return candidate;
    }
  }

  return null;
}
