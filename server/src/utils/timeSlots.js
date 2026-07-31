import { addDays, formatDate, sameDate, toLocalDate } from './date.js';

export const bookingConfig = {
  maxAdvanceDays: 60,
  slotIntervalMinutes: 30,
  minimumAdvanceMinutes: 60
};

function resolveConfig(config = {}) {
  return {
    maxAdvanceDays: config.maximum_advance_days ?? config.maxAdvanceDays ?? bookingConfig.maxAdvanceDays,
    slotIntervalMinutes: config.slot_interval_minutes ?? config.slotIntervalMinutes ?? bookingConfig.slotIntervalMinutes,
    minimumAdvanceMinutes: config.minimum_advance_minutes ?? config.minimumAdvanceMinutes ?? bookingConfig.minimumAdvanceMinutes,
    bufferMinutes: config.buffer_minutes ?? config.bufferMinutes ?? 0,
    allowSameDay: config.allow_same_day ?? config.allowSameDay ?? true
  };
}

export function timeToMinutes(time) {
  const [hours, minutes] = time.split(':').map(Number);
  return hours * 60 + minutes;
}

export function minutesToTime(totalMinutes) {
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

export function addMinutesToTime(time, minutes) {
  return minutesToTime(timeToMinutes(time) + minutes);
}

export function getRequiredSlots(startTime, durationMinutes, intervalMinutes = bookingConfig.slotIntervalMinutes) {
  const slots = [];
  for (let offset = 0; offset < durationMinutes; offset += intervalMinutes) {
    slots.push(addMinutesToTime(startTime, offset));
  }
  return slots;
}

export function calculateEndTime(startTime, durationMinutes) {
  return addMinutesToTime(startTime, durationMinutes);
}

export function intervalsOverlap(firstStart, firstEnd, secondStart, secondEnd) {
  return timeToMinutes(firstStart) < timeToMinutes(secondEnd) && timeToMinutes(secondStart) < timeToMinutes(firstEnd);
}

export function hasAppointmentConflict(startTime, durationMinutes, appointments) {
  const endTime = calculateEndTime(startTime, durationMinutes);
  return appointments.some((appointment) => {
    const appointmentEnd = appointment.end_time || addMinutesToTime(appointment.start_time, 30);
    return intervalsOverlap(startTime, endTime, appointment.start_time, appointmentEnd);
  });
}

function isInsideBreak(startTime, endTime, businessHours) {
  if (!businessHours.break_start || !businessHours.break_end) {
    return false;
  }
  return intervalsOverlap(startTime, endTime, businessHours.break_start, businessHours.break_end);
}

function getBlockedReason(date, startTime, endTime, blockedDates, recurringBlockedDates) {
  const monthDay = date.slice(5);
  if (recurringBlockedDates.includes(monthDay)) {
    return 'Feriado';
  }

  const block = blockedDates.find((item) => {
    const startDate = item.start_date || item.blocked_date;
    const endDate = item.end_date || item.blocked_date;

    if (item.active === false || date < startDate || date > endDate) {
      return false;
    }
    if (item.all_day) {
      return true;
    }
    if (!item.start_time || !item.end_time) {
      return true;
    }
    return intervalsOverlap(startTime, endTime, item.start_time, item.end_time);
  });

  return block?.title || block?.reason || null;
}

function isPastSlot(date, startTime, now, minimumAdvanceMinutes) {
  const slotDate = toLocalDate(date);
  const [hours, minutes] = startTime.split(':').map(Number);
  slotDate.setHours(hours, minutes, 0, 0);
  return slotDate.getTime() <= now.getTime() + minimumAdvanceMinutes * 60_000;
}

function normalizeBusinessPeriod(period) {
  if (!period) return null;
  return {
    active: period.active,
    start_time: period.start_time || period.opening_time,
    end_time: period.end_time || period.closing_time,
    break_start: period.break_start,
    break_end: period.break_end
  };
}

export function generateCandidateSlots(businessHours, durationMinutes, intervalMinutes = bookingConfig.slotIntervalMinutes) {
  const periods = (Array.isArray(businessHours) ? businessHours : [businessHours])
    .map(normalizeBusinessPeriod)
    .filter((period) => period?.active);

  if (periods.length === 0) {
    return [];
  }

  const slots = [];
  periods.forEach((period) => {
    const open = timeToMinutes(period.start_time);
    const close = timeToMinutes(period.end_time);

    for (let start = open; start + durationMinutes <= close; start += intervalMinutes) {
      const startTime = minutesToTime(start);
      const endTime = minutesToTime(start + durationMinutes);
      if (!isInsideBreak(startTime, endTime, period)) {
        slots.push(startTime);
      }
    }
  });

  return [...new Set(slots)].sort();
}

export function buildAvailability({ date, service, businessHours, appointments, blockedDates, recurringBlockedDates, now = new Date(), config = {} }) {
  const resolvedConfig = resolveConfig(config);
  const selectedDate = toLocalDate(date);
  const today = new Date(now);
  today.setHours(0, 0, 0, 0);
  const maxDate = addDays(today, resolvedConfig.maxAdvanceDays);
  const duration = service.duration_minutes;

  if (selectedDate < today || selectedDate > maxDate || (!resolvedConfig.allowSameDay && sameDate(selectedDate, today))) {
    return [];
  }

  return generateCandidateSlots(businessHours, duration + resolvedConfig.bufferMinutes, resolvedConfig.slotIntervalMinutes).map((time) => {
    const endTime = calculateEndTime(time, duration);
    const blockedEndTime = calculateEndTime(time, duration + resolvedConfig.bufferMinutes);
    const blockedReason = getBlockedReason(date, time, endTime, blockedDates, recurringBlockedDates);
    const past = isPastSlot(date, time, now, resolvedConfig.minimumAdvanceMinutes);
    const occupied = hasAppointmentConflict(time, duration + resolvedConfig.bufferMinutes, appointments);
    const status = blockedReason ? 'unavailable' : past ? 'past' : occupied ? 'occupied' : 'available';

    return {
      time,
      endTime,
      status,
      period: getPeriod(time),
      reason: blockedReason || null,
      requiredSlots: getRequiredSlots(time, duration + resolvedConfig.bufferMinutes),
      blockedEndTime
    };
  });
}

export function getPeriod(time) {
  const minutes = timeToMinutes(time);
  if (minutes < 12 * 60) {
    return 'morning';
  }
  if (minutes < 18 * 60) {
    return 'afternoon';
  }
  return 'evening';
}

export function groupAvailability(slots) {
  return {
    morning: slots.filter((slot) => slot.period === 'morning'),
    afternoon: slots.filter((slot) => slot.period === 'afternoon'),
    evening: slots.filter((slot) => slot.period === 'evening')
  };
}

export function findNextAvailableDate({ fromDate, service, getBusinessHours, getAppointments, getBlockedDates, recurringBlockedDates, now = new Date() }) {
  const start = toLocalDate(fromDate);

  for (let offset = 1; offset <= bookingConfig.maxAdvanceDays; offset += 1) {
    const candidate = formatDate(addDays(start, offset));
    const businessHours = getBusinessHours(toLocalDate(candidate).getDay());
    const appointments = getAppointments(candidate);
    const blockedDates = getBlockedDates(candidate, candidate);
    const availability = buildAvailability({
      date: candidate,
      service,
      businessHours,
      appointments,
      blockedDates,
      recurringBlockedDates,
      now
    });

    if (availability.some((slot) => slot.status === 'available')) {
      return candidate;
    }
  }

  return null;
}

export function dateIsToday(date, now = new Date()) {
  return sameDate(toLocalDate(date), now);
}
