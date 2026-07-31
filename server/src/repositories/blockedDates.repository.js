import { supabase } from '../config/supabase.js';
import { memoryStore } from '../data.seed.js';

export async function listBlockedDates(start, end) {
  if (!supabase) {
    return memoryStore.blockedDates.filter((item) => {
      const blockStart = item.start_date || item.blocked_date;
      const blockEnd = item.end_date || item.blocked_date;
      return blockStart <= end && blockEnd >= start && item.active !== false;
    });
  }

  const { data, error } = await supabase
    .from('blocked_periods')
    .select('id, title, reason, start_date, end_date, all_day, start_time, end_time, active, created_at')
    .lte('start_date', end)
    .gte('end_date', start)
    .eq('active', true)
    .order('start_date', { ascending: true });

  if (error) {
    throw error;
  }

  return data || [];
}
