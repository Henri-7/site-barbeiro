import { supabase } from '../config/supabase.js';
import { seedBusinessHours } from '../data.seed.js';

export async function getBusinessHoursByWeekday(weekday) {
  if (!supabase) {
    return seedBusinessHours.filter((item) => item.weekday === weekday && item.active);
  }

  const { data, error } = await supabase
    .from('business_hours')
    .select('id, weekday, start_time, end_time, active')
    .eq('weekday', weekday)
    .eq('active', true)
    .order('start_time', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}

export async function listBusinessHours() {
  if (!supabase) {
    return seedBusinessHours;
  }

  const { data, error } = await supabase
    .from('business_hours')
    .select('id, weekday, start_time, end_time, active')
    .order('weekday')
    .order('start_time');

  if (error) {
    throw error;
  }

  return data || [];
}
