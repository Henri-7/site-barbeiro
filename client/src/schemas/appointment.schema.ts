import { z } from 'zod';

export const appointmentSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(3, 'Informe seu nome completo.')
    .max(100, 'Nome muito longo.'),
  customerPhone: z
    .string()
    .regex(/^\(\d{2}\) 9\d{4}-\d{4}$/, 'Use o formato (xx) 9xxxx-xxxx.'),
  notes: z.string().trim().max(280, 'Use até 280 caracteres.').optional()
});

export type AppointmentFormData = z.infer<typeof appointmentSchema>;
