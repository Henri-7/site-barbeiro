export const seedServices = [
  {
    id: 'corte-masculino',
    name: 'Corte Masculino',
    description: 'Corte alinhado ao seu estilo, com acabamento limpo e finalização.',
    price: 35,
    duration_minutes: 30,
    active: true,
    featured: true
  },
  {
    id: 'barba-completa',
    name: 'Barba Completa',
    description: 'Barba desenhada, alinhamento e finalização para um visual bem cuidado.',
    price: 30,
    duration_minutes: 30,
    active: true,
    featured: false
  },
  {
    id: 'corte-barba',
    name: 'Corte + Barba',
    description: 'Combo completo para sair com cabelo e barba no ponto.',
    price: 55,
    duration_minutes: 60,
    active: true,
    featured: true
  }
];

export const seedBusinessHours = [
  { id: 'mon-morning', weekday: 1, start_time: '08:00', end_time: '12:00', active: true },
  { id: 'mon-afternoon', weekday: 1, start_time: '14:00', end_time: '19:00', active: true },
  { id: 'tue-morning', weekday: 2, start_time: '08:00', end_time: '12:00', active: true },
  { id: 'tue-afternoon', weekday: 2, start_time: '14:00', end_time: '19:00', active: true },
  { id: 'wed-morning', weekday: 3, start_time: '08:00', end_time: '12:00', active: true },
  { id: 'wed-afternoon', weekday: 3, start_time: '14:00', end_time: '19:00', active: true },
  { id: 'thu-morning', weekday: 4, start_time: '08:00', end_time: '12:00', active: true },
  { id: 'thu-afternoon', weekday: 4, start_time: '14:00', end_time: '19:00', active: true },
  { id: 'fri-morning', weekday: 5, start_time: '08:00', end_time: '12:00', active: true },
  { id: 'fri-afternoon', weekday: 5, start_time: '14:00', end_time: '19:00', active: true },
  { id: 'sat-morning', weekday: 6, start_time: '08:00', end_time: '12:00', active: true },
  { id: 'sat-afternoon', weekday: 6, start_time: '14:00', end_time: '19:00', active: true }
];

export const recurringBlockedDates = ['01-01', '04-21', '05-01', '09-07', '10-12', '11-02', '11-15', '12-25'];

export const memoryStore = {
  appointments: [],
  blockedDates: [],
  galleryImages: [],
  siteContent: [
    {
      id: 'hero-copy',
      section_key: 'hero',
      content_key: 'copy',
      content_value: {
        eyebrow: 'Barbearia Elite em Cássia, MG',
        title: 'Corte, barba e presença.',
        description: 'Atendimento masculino com pontualidade, acabamento fino e agenda online.'
      },
      updated_at: new Date().toISOString()
    }
  ],
  customers: [],
  settings: [
    {
      id: 'business',
      settings_key: 'business',
      settings_value: {
        name: 'Barbearia Elite',
        phone: '(35) 98475-2062',
        whatsapp: '5535984752062',
        timezone: 'America/Sao_Paulo',
        currency: 'BRL',
        address: 'Endereço a definir'
      }
    },
    {
      id: 'booking',
      settings_key: 'booking',
      settings_value: {
        maxAdvanceDays: 60,
        minimumAdvanceMinutes: 60,
        slotIntervalMinutes: 30,
        initialStatus: 'pending',
        requireConfirmation: true
      }
    }
  ],
  activityLogs: []
};

export const seedBookingSettings = {
  slot_interval_minutes: 30,
  minimum_advance_minutes: 60,
  maximum_advance_days: 60,
  buffer_minutes: 0,
  allow_same_day: true,
  require_confirmation: true,
  timezone: 'America/Sao_Paulo',
  currency: 'BRL'
};
