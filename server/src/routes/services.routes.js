import { Router } from 'express';
import { listServicesController } from '../controllers/services.controller.js';

export const servicesRouter = Router();

servicesRouter.get('/', listServicesController);
