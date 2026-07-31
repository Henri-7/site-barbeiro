import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { ServiceStep } from '../../client/src/components/booking/ServiceStep';
import { appointmentSchema } from '../../client/src/schemas/appointment.schema';
import type { Service } from '../../client/src/types/service';

const services: Service[] = [
  {
    id: 'corte-masculino',
    name: 'Corte Masculino',
    description: 'Corte alinhado',
    price: 35,
    durationMinutes: 30,
    active: true,
    featured: true
  }
];

describe('booking frontend', () => {
  it('seleciona servico visualmente', async () => {
    const user = userEvent.setup();
    const onSelect = vi.fn();
    render(<ServiceStep services={services} selectedServiceId={undefined} onSelect={onSelect} />);

    await user.click(screen.getByRole('button', { name: /corte masculino/i }));

    expect(onSelect).toHaveBeenCalledWith(services[0]);
  });

  it('valida dados do formulario', () => {
    const parsed = appointmentSchema.safeParse({
      customerName: 'Joao Cliente',
      customerPhone: '(35) 98475-2062',
      notes: ''
    });

    expect(parsed.success).toBe(true);
  });
});
