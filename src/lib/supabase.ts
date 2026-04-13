import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://qqebpyqfasghbeognibo.supabase.co';
const supabaseAnonKey = (import.meta as any).env.VITE_SUPABASE_ANON_KEY;

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase = () => {
  if (!supabaseAnonKey || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
    console.error('CRITICAL: VITE_SUPABASE_ANON_KEY is missing or using placeholder. Google Login will fail.');
    return null;
  }
  
  if (!supabaseInstance) {
    try {
      supabaseInstance = createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
          detectSessionInUrl: true
        }
      });
      console.log('Supabase client initialized successfully.');
    } catch (err) {
      console.error('Failed to initialize Supabase client:', err);
      return null;
    }
  }
  
  return supabaseInstance;
};
