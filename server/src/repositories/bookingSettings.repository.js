import { supabase } from '../config/supabase.js';
import { seedBookingSettings } from '../data.seed.js';

export async function getBookingSettings() {
  if (!supabase) {
    return seedBookingSettings;
  }

  const { data, error } = await supabase
    .from('booking_settings')
    .select('slot_interval_minutes, minimum_advance_minutes, maximum_advance_days, buffer_minutes, allow_same_day, require_confirmation, timezone, currency')
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || seedBookingSettings;
}
