import { supabase } from '../config/supabase.js';
import { seedServices } from '../data.seed.js';

export async function listActiveServices() {
  if (!supabase) {
    return seedServices.filter((service) => service.active);
  }

  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, price, duration_minutes, active, featured')
    .eq('active', true)
    .order('display_order', { ascending: true })
    .order('featured', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function findServiceById(id) {
  if (!supabase) {
    return seedServices.find((service) => service.id === id && service.active) || null;
  }

  const { data, error } = await supabase
    .from('services')
    .select('id, name, description, price, duration_minutes, active, featured')
    .eq('id', id)
    .eq('active', true)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
}
