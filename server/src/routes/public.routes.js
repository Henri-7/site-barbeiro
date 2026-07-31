import { Router } from 'express';
import * as controller from '../controllers/public.controller.js';

export const publicRouter = Router();

publicRouter.get('/site-content', controller.publicSiteContent);
publicRouter.get('/services', controller.publicServices);
publicRouter.get('/gallery', controller.publicGallery);
publicRouter.get('/business-hours', controller.publicBusinessHours);
publicRouter.get('/availability', controller.publicAvailability);
publicRouter.post('/appointments', controller.publicCreateAppointment);
