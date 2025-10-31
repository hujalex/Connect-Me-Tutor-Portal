// "use client"
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { createBrowserClient } from "@supabase/ssr";
import { create } from "domain";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

let supabaseInstance: any | null = null;

export const getSupabase =  () => {
  if (!supabaseInstance) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anon_key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    supabaseInstance = createClient(url!, anon_key!);
  }

  return supabaseInstance;
};

export const supabaseClient = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

export const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});
