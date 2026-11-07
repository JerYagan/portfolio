import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { env, isSupabaseConfigured } from '@/lib/env';

export function createPublicSupabaseClient() {
  if (!isSupabaseConfigured || !env.supabaseUrl || !env.supabasePublishableKey) return null;

  return createClient(env.supabaseUrl, env.supabasePublishableKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
  });
}
