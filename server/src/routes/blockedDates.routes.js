import { Router } from 'express';
import { blockedDatesController } from '../controllers/blockedDates.controller.js';

export const blockedDatesRouter = Router();

blockedDatesRouter.get('/', blockedDatesController);
