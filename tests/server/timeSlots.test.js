import { describe, expect, it } from 'vitest';
import { buildAvailability, calculateEndTime, getRequiredSlots, hasAppointmentConflict } from '../../server/src/utils/timeSlots.js';

const businessHours = {
  opening_time: '08:00',
  closing_time: '19:00',
  break_start: '12:00',
  break_end: '14:00',
  active: true
};

describe('timeSlots', () => {
  it('calcula horario final e slots necessarios por duracao', () => {
    expect(calculateEndTime('10:30', 60)).toBe('11:30');
    expect(getRequiredSlots('10:30', 60)).toEqual(['10:30', '11:00']);
  });

  it('identifica conflito entre intervalos', () => {
    expect(hasAppointmentConflict('10:30', 60, [{ start_time: '11:00', end_time: '11:30' }])).toBe(true);
    expect(hasAppointmentConflict('10:30', 30, [{ start_time: '11:00', end_time: '11:30' }])).toBe(false);
  });

  it('filtra horarios passados, ocupados e intervalo de almoco', () => {
    const slots = buildAvailability({
      date: '2099-05-05',
      service: { duration_minutes: 60 },
      businessHours,
      appointments: [{ start_time: '10:00', end_time: '10:30' }],
      blockedDates: [],
      recurringBlockedDates: [],
      now: new Date('2099-05-05T08:00:00')
    });

    expect(slots.find((slot) => slot.time === '10:00')?.status).toBe('occupied');
    expect(slots.some((slot) => slot.time === '11:30')).toBe(false);
    expect(slots.find((slot) => slot.time === '14:00')?.status).toBe('available');
  });
});
