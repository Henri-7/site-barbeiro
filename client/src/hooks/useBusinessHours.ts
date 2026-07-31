import { useEffect, useState } from 'react';
import { fetchPublicBusinessHours, type PublicBusinessHour } from '../services/public.api';

export function useBusinessHours() {
  const [businessHours, setBusinessHours] = useState<PublicBusinessHour[] | null>(null);

  useEffect(() => {
    let active = true;

    fetchPublicBusinessHours()
      .then((items) => {
        if (active) setBusinessHours(items);
      })
      .catch(() => {
        if (active) setBusinessHours(null);
      });

    return () => {
      active = false;
    };
  }, []);

  return businessHours;
}
