import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || import.meta.env.NEXT_PUBLIC_SUPABASE_URL) as string | undefined;
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) as string | undefined;

const configuredByEnv = Boolean(supabaseUrl && supabaseAnonKey);

export const supabase = (() => {
  if (!configuredByEnv) return null;
  try {
    return createClient(supabaseUrl!, supabaseAnonKey!, {
      auth: {
        autoRefreshToken: true,
        detectSessionInUrl: true,
        flowType: "pkce",
        persistSession: true
      }
    });
  } catch (error) {
    console.warn("VZN Supabase client could not be created:", error);
    return null;
  }
})();

export const isSupabaseConfigured = Boolean(supabase);
