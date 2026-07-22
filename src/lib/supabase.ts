import { createClient } from "@supabase/supabase-js";

const url = import.meta.env.VITE_SUPABASE_URL?.trim();
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY?.trim();

export const supabaseConfigured = Boolean(url && publishableKey);

export const supabase = supabaseConfigured
  ? createClient(url, publishableKey, {
      auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
      global: { headers: { "X-Client-Info": "tambo-bi-grupo06/1.0" } },
    })
  : null;

export function requireSupabase() {
  if (!supabase) {
    throw new Error("Falta configurar VITE_SUPABASE_URL y VITE_SUPABASE_PUBLISHABLE_KEY.");
  }
  return supabase;
}
