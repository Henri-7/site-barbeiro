import type { Service } from '../types/service';

export const fallbackServices: Service[] = [
  {
    id: 'corte-masculino',
    name: 'Corte Masculino',
    description: 'Corte alinhado ao seu estilo, com acabamento limpo e finalização.',
    price: 35,
    durationMinutes: 30,
    active: true,
    featured: true
  },
  {
    id: 'barba-completa',
    name: 'Barba Completa',
    description: 'Barba desenhada, alinhamento e finalização para um visual bem cuidado.',
    price: 30,
    durationMinutes: 30,
    active: true,
    featured: false
  },
  {
    id: 'corte-barba',
    name: 'Corte + Barba',
    description: 'Combo completo para sair com cabelo e barba no ponto.',
    price: 55,
    durationMinutes: 60,
    active: true,
    featured: true
  }
];
