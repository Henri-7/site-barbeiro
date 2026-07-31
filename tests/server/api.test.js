import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { app } from '../../server/src/app.js';
import { memoryStore } from '../../server/src/data.seed.js';

function nextWeekdayDate() {
  const date = new Date();
  date.setDate(date.getDate() + 2);
  while (date.getDay() === 0) {
    date.setDate(date.getDate() + 1);
  }
  return date.toISOString().slice(0, 10);
}

describe('api', () => {
  beforeEach(() => {
    memoryStore.appointments = [];
    memoryStore.blockedDates = [];
    memoryStore.customers = [];
  });

  it('retorna servicos ativos', async () => {
    const response = await request(app).get('/api/services').expect(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(3);
  });

  it('cria uma solicitacao e bloqueia conflito em seguida', async () => {
    const date = nextWeekdayDate();
    const payload = {
      serviceId: 'corte-barba',
      appointmentDate: date,
      startTime: '14:00',
      customerName: 'Cliente Teste',
      customerPhone: '(35) 98475-2062',
      notes: 'Sem observacoes'
    };

    const response = await request(app).post('/api/appointments').send(payload).expect(201);
    const conflict = await request(app).post('/api/appointments').send(payload).expect(409);

    expect(response.body.data.whatsappNotification.status).toBe('disabled');
    expect(response.body.data.whatsappLink).toContain('https://wa.me/5535984752062?text=');
    expect(conflict.body.error.code).toBe('SLOT_UNAVAILABLE');
  });

  it('reutiliza o telefone sem trocar o nome dos agendamentos anteriores', async () => {
    const date = nextWeekdayDate();
    const firstPayload = {
      serviceId: 'corte-masculino',
      appointmentDate: date,
      startTime: '08:00',
      customerName: 'Cliente Original',
      customerPhone: '(35) 98475-2062',
      notes: ''
    };
    const secondPayload = {
      ...firstPayload,
      startTime: '09:00',
      customerName: 'Cliente Atualizado'
    };

    await request(app).post('/api/public/appointments').send(firstPayload).expect(201);
    await request(app).post('/api/public/appointments').send(secondPayload).expect(201);
    const appointments = await request(app).get('/api/admin/appointments?pageSize=20').expect(200);
    const names = appointments.body.data.items.map((item) => item.customer_name);

    expect(memoryStore.customers).toHaveLength(1);
    expect(memoryStore.customers[0].name).toBe('Cliente Original');
    expect(names).toContain('Cliente Original');
    expect(names).toContain('Cliente Atualizado');
  });
});
