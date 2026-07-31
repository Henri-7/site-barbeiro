import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const supabaseKey = env.supabaseServiceRoleKey || env.supabaseAnonKey;
const isTestRuntime = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const isProductionRuntime = process.env.NODE_ENV === 'production' || process.env.NETLIFY === 'true';

export const hasSupabase = Boolean(env.supabaseUrl && supabaseKey && !isTestRuntime);
export const allowLocalAdminFallback = !hasSupabase && !isProductionRuntime;

export const supabase = hasSupabase
  ? createClient(env.supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;
