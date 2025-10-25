// lib/admins.actions.ts

// lib/student.actions.ts
import { supabase } from "../supabase/client";
import { AdminConversation } from "@/types/chat";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";



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

export async function fetchAdminConversations() {
  const { data, error } = await supabase.rpc("get_admin_conversations");
  return data as AdminConversation[];
}
