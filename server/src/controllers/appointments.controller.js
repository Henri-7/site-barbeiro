import { requestAppointment } from '../services/appointments.service.js';

export async function createAppointmentController(request, response, next) {
  try {
    const result = await requestAppointment(request.body);
    response.status(201).json({
      success: true,
      data: result,
      message: 'Agendamento salvo. A confirmação será enviada pelo WhatsApp.'
    });
  } catch (error) {
    next(error);
  }
}
