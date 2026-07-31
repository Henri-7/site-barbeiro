import { Router } from 'express';
import { requireAdmin } from '../middlewares/adminAuth.js';
import * as controller from '../controllers/admin.controller.js';

export const adminRouter = Router();

adminRouter.post('/auth/login', controller.login);
adminRouter.post('/auth/refresh', controller.refresh);
adminRouter.post('/auth/recover', controller.recoverPassword);

adminRouter.use(requireAdmin);

adminRouter.get('/auth/me', controller.me);
adminRouter.get('/dashboard', controller.dashboard);

adminRouter.get('/appointments', controller.listAppointments);
adminRouter.get('/appointments/:id', controller.getAppointment);
adminRouter.post('/appointments', controller.createAppointment);
adminRouter.patch('/appointments/:id', controller.patchAppointment);
adminRouter.delete('/appointments/:id', controller.deleteAppointment);

adminRouter.get('/services', controller.listServices);
adminRouter.post('/services', controller.saveService);
adminRouter.patch('/services/:id', controller.saveService);
adminRouter.delete('/services/:id', controller.deleteService);

adminRouter.get('/business-hours', controller.listBusinessHours);
adminRouter.post('/business-hours', controller.saveBusinessHour);
adminRouter.patch('/business-hours/:id', controller.saveBusinessHour);
adminRouter.delete('/business-hours/:id', controller.saveBusinessHour);

adminRouter.get('/blocked-dates', controller.listBlockedDates);
adminRouter.post('/blocked-dates', controller.saveBlockedDate);
adminRouter.patch('/blocked-dates/:id', controller.saveBlockedDate);
adminRouter.delete('/blocked-dates/:id', controller.deleteBlockedDate);

adminRouter.get('/gallery', controller.listGallery);
adminRouter.post('/gallery', controller.saveGallery);
adminRouter.post('/gallery/upload', controller.uploadGallery);
adminRouter.patch('/gallery/reorder', controller.saveGallery);
adminRouter.patch('/gallery/:id', controller.saveGallery);
adminRouter.delete('/gallery/:id', controller.deleteGallery);

adminRouter.get('/customers', controller.listCustomers);
adminRouter.get('/customers/:id', controller.listCustomers);
adminRouter.patch('/customers/:id', controller.saveCustomer);
adminRouter.post('/customers', controller.saveCustomer);

adminRouter.get('/activity-logs', controller.listActivityLogs);
