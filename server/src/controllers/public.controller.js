import { getAvailability } from '../services/availability.service.js';
import { requestAppointment } from '../services/appointments.service.js';
import { adminListBusinessHours, adminListSimple } from '../repositories/admin.repository.js';
import { listActiveServices } from '../repositories/services.repository.js';

function ok(response, data, message) {
  response.json({ success: true, data, message });
}

export async function publicServices(_request, response, next) {
  try {
    ok(response, await listActiveServices(), 'Serviços públicos carregados.');
  } catch (error) {
    next(error);
  }
}

export async function publicGallery(_request, response, next) {
  try {
    const images = (await adminListSimple('gallery_images'))
      .filter((image) => image.active)
      .sort((first, second) => Number(first.display_order || 0) - Number(second.display_order || 0) || String(first.title || '').localeCompare(String(second.title || '')));

    ok(response, images, 'Galeria publica carregada.');
  } catch (error) {
    next(error);
  }
}

export async function publicSiteContent(_request, response, next) {
  try {
    ok(response, await adminListSimple('site_content'), 'Conteúdo público carregado.');
  } catch (error) {
    next(error);
  }
}

export async function publicBusinessHours(_request, response, next) {
  try {
    ok(response, await adminListBusinessHours(), 'Horários públicos carregados.');
  } catch (error) {
    next(error);
  }
}

export async function publicAvailability(request, response, next) {
  try {
    ok(response, await getAvailability(request.query.date, request.query.serviceId), 'Disponibilidade carregada.');
  } catch (error) {
    next(error);
  }
}

export async function publicCreateAppointment(request, response, next) {
  try {
    response.status(201).json({
      success: true,
      data: await requestAppointment(request.body),
      message: 'Agendamento salvo. A confirmação será enviada pelo WhatsApp.'
    });
  } catch (error) {
    next(error);
  }
}
