import { createClient } from '@supabase/supabase-js';
import { env } from './env.js';

const supabaseKey = env.supabaseServiceRoleKey || env.supabaseAnonKey;
const supabaseAuthKey = env.supabaseAnonKey || supabaseKey;
const isTestRuntime = process.env.NODE_ENV === 'test' || process.env.VITEST === 'true';
const isProductionRuntime =
  process.env.NODE_ENV === 'production' ||
  process.env.NETLIFY === 'true' ||
  process.env.RENDER === 'true' ||
  Boolean(process.env.RENDER_EXTERNAL_URL);

export const hasSupabase = Boolean(env.supabaseUrl && supabaseKey && !isTestRuntime);
export const hasSupabaseAuth = Boolean(env.supabaseUrl && supabaseAuthKey && !isTestRuntime);
export const allowLocalAdminFallback = !hasSupabase && !isProductionRuntime;

export const supabase = hasSupabase
  ? createClient(env.supabaseUrl, supabaseKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;

export const supabaseAuth = hasSupabaseAuth
  ? createClient(env.supabaseUrl, supabaseAuthKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    })
  : null;
