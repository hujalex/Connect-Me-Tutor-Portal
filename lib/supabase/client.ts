import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { create } from "domain";

let supabaseInstance: SupabaseClient | null = null;

export const getSupabase =  () => {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    supabaseInstance = createClient(url!, anon_key!);
  }

  return supabaseInstance;
};
