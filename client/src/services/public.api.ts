import { apiRequest } from './api';

export type PublicContent = {
  section_key: string;
  content_key: string;
  content_value: unknown;
};

export type PublicGalleryImage = {
  id: string;
  title: string;
  description?: string;
  alt_text: string;
  public_url?: string;
  storage_path?: string;
  path?: string;
  category?: string;
  display_order?: number;
  active: boolean;
};

export type PublicBusinessHour = {
  id?: string;
  weekday: number;
  start_time: string;
  end_time: string;
  active: boolean;
};

export function fetchPublicContent() {
  return apiRequest<PublicContent[]>('/public/site-content');
}

export function fetchPublicGallery() {
  return apiRequest<PublicGalleryImage[]>('/public/gallery');
}

export function fetchPublicBusinessHours() {
  return apiRequest<PublicBusinessHour[]>('/public/business-hours');
}
