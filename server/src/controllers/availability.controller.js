import { getAvailability } from '../services/availability.service.js';

export async function availabilityController(request, response, next) {
  try {
    const availability = await getAvailability(request.query.date, request.query.serviceId);
    response.json({
      success: true,
      data: availability,
      message: 'Disponibilidade carregada.'
    });
  } catch (error) {
    next(error);
  }
}
