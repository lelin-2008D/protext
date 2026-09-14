import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from '../config.js';

let supabaseClient: SupabaseClient | null = null;

export function getSupabaseAdmin(): SupabaseClient | null {
  if (supabaseClient) return supabaseClient;

  if (config.supabaseUrl && config.supabaseServiceRoleKey) {
    try {
      supabaseClient = createClient(config.supabaseUrl, config.supabaseServiceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      });
      return supabaseClient;
    } catch (err) {
      console.warn('[Supabase] Warning: Could not initialize Supabase admin client:', err);
    }
  }

  return null;
}
