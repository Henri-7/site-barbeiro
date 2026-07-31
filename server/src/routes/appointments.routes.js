import { Router } from 'express';
import { createAppointmentController } from '../controllers/appointments.controller.js';

export const appointmentsRouter = Router();

appointmentsRouter.post('/', createAppointmentController);
