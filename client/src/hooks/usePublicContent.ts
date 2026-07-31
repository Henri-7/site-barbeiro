import { useEffect, useState } from 'react';
import { fetchPublicContent, type PublicContent } from '../services/public.api';

export function usePublicContent() {
  const [content, setContent] = useState<PublicContent[]>([]);

  useEffect(() => {
    let active = true;
    fetchPublicContent()
      .then((items) => {
        if (active) setContent(items);
      })
      .catch(() => {
        if (active) setContent([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return content;
}
