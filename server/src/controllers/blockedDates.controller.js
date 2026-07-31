import { getBlockedDates } from '../services/blockedDates.service.js';

export async function blockedDatesController(request, response, next) {
  try {
    const blockedDates = await getBlockedDates(request.query.start, request.query.end);
    response.json({
      success: true,
      data: blockedDates,
      message: 'Datas bloqueadas carregadas.'
    });
  } catch (error) {
    next(error);
  }
}
