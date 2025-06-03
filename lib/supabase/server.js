import { createServerComponentClient } from '@supabase/auth-helpers-nextjs';
import { cookies } from "next/headers";

export function createClient() {
  const cookieStore = cookies();

  return createServerComponentClient(
    {
      cookies: () => cookieStore,
    },
    {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    }
  );
}