// lib/admins.actions.ts

// lib/student.actions.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export async function fetchAdmins() {
  try {
    const { data, error } = await supabase
      .from("Profiles")
      .select("*")
      .eq("role", "Admin");
    if (error) throw error;
    console.log(data);
    return data;
  } catch (error) {
    console.error("unable to fetch admin information");
  }
}
