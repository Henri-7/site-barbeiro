import { useEffect, useState } from 'react';
import { fetchPublicGallery, type PublicGalleryImage } from '../services/public.api';

export function usePublicGallery() {
  const [images, setImages] = useState<PublicGalleryImage[]>([]);

  useEffect(() => {
    let active = true;
    fetchPublicGallery()
      .then((items) => {
        if (active) setImages(items);
      })
      .catch(() => {
        if (active) setImages([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return images;
}
