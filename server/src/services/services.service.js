import { listActiveServices } from '../repositories/services.repository.js';

export async function getServices() {
  return listActiveServices();
}
