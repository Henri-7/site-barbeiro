import { getServices } from '../services/services.service.js';

export async function listServicesController(_request, response, next) {
  try {
    const services = await getServices();
    response.json({
      success: true,
      data: services,
      message: 'Serviços carregados.'
    });
  } catch (error) {
    next(error);
  }
}
