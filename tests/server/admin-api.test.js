import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../server/src/app.js';
import { memoryStore, seedBusinessHours } from '../../server/src/data.seed.js';
import { getBusinessHoursByWeekday } from '../../server/src/repositories/businessHours.repository.js';
import { buildAvailability } from '../../server/src/utils/timeSlots.js';

describe('admin api', () => {
  beforeEach(() => {
    memoryStore.activityLogs = [];
  });

  it('carrega dashboard administrativo em modo local', async () => {
    const response = await request(app).get('/api/admin/dashboard').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.cards).toHaveProperty('pending');
  });

  it('cria e desativa servico administrativo', async () => {
    const service = {
      id: 'teste-admin',
      name: 'Servico Admin',
      description: 'Servico criado pelo teste',
      price: 40,
      duration_minutes: 30,
      active: true,
      featured: false,
      display_order: 9
    };

    const created = await request(app).post('/api/admin/services').send(service).expect(200);
    expect(created.body.data.id).toBe('teste-admin');

    const removed = await request(app).delete('/api/admin/services/teste-admin').expect(200);
    expect(removed.body.data.active).toBe(false);
  });

  it('fecha somente o periodo escolhido e remove seus horarios da agenda', async () => {
    const morning = seedBusinessHours.find((hour) => hour.id === 'mon-morning');
    const afternoon = seedBusinessHours.find((hour) => hour.id === 'mon-afternoon');
    const originalMorning = { ...morning };
    const originalAfternoon = { ...afternoon };

    try {
      const response = await request(app)
        .patch('/api/admin/business-hours/mon-morning')
        .send({ ...morning, start_time: '08:00:00', end_time: '12:00:00', active: false })
        .expect(200);

      expect(response.body.data.active).toBe(false);
      expect(response.body.data.start_time).toBe('08:00');
      expect(afternoon.active).toBe(true);

      const activeBusinessHours = await getBusinessHoursByWeekday(1);
      const slots = buildAvailability({
        date: '2099-05-04',
        service: { duration_minutes: 30 },
        businessHours: activeBusinessHours,
        appointments: [],
        blockedDates: [],
        recurringBlockedDates: [],
        now: new Date('2099-05-01T08:00:00')
      });
      const times = slots.map((slot) => slot.time);

      expect(times).not.toContain('08:00');
      expect(times).not.toContain('11:30');
      expect(times).toContain('14:00');
    } finally {
      Object.assign(morning, originalMorning);
      Object.assign(afternoon, originalAfternoon);
    }
  });
});
