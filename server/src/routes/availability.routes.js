import { Router } from 'express';
import { availabilityController } from '../controllers/availability.controller.js';

export const availabilityRouter = Router();

availabilityRouter.get('/', availabilityController);
