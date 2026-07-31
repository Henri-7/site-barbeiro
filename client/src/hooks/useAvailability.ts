import { useEffect, useState } from 'react';
import { fetchAvailability } from '../services/availability.api';
import type { AvailabilityResponse } from '../types/availability';

export function useAvailability(date: string | null, serviceId: string | null) {
  const [availability, setAvailability] = useState<AvailabilityResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function loadAvailability() {
    if (!date || !serviceId) {
      setAvailability(null);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);
      setAvailability(await fetchAvailability(date, serviceId));
    } catch {
      setAvailability(null);
      setError('A barbearia estará fechada nesse dia.');
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadAvailability();
  }, [date, serviceId]);

  return { availability, isLoading, error, reload: loadAvailability };
}
