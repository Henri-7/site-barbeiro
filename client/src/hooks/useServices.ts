import { useEffect, useState } from 'react';
import { fallbackServices } from '../data/fallbackServices';
import { fetchServices } from '../services/services.api';
import type { Service } from '../types/service';

export function useServices() {
  const [services, setServices] = useState<Service[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function loadServices() {
    try {
      setIsLoading(true);
      setError(null);
      setServices(await fetchServices());
    } catch {
      setServices(fallbackServices);
      setError(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadServices();
  }, []);

  return { services, isLoading, error, reload: loadServices };
}
