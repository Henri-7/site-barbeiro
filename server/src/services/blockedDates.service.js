import { listBlockedDates } from '../repositories/blockedDates.repository.js';
import { isValidDateString } from '../utils/date.js';

export async function getBlockedDates(start, end) {
  if (!isValidDateString(start) || !isValidDateString(end)) {
    const error = new Error('Informe datas validas no formato YYYY-MM-DD.');
    error.status = 400;
    error.code = 'INVALID_DATE_RANGE';
    throw error;
  }

  return listBlockedDates(start, end);
}
