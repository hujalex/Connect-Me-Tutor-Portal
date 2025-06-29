import { Session } from "@/types";
import { toast } from "react-hot-toast";
import { Client } from "@upstash/qstash";
import { createClient } from "@supabase/supabase-js";
import { Profile } from "@/types";
import { getProfileWithProfileId } from "./user.actions";

export async function getSessions(
  start: string,
  end: string
): Promise<Session[]> {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error("Missing Supabase environment variables");
    }
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const { data: sessionData, error: sessionError } = await supabase
      .from("Sessions")
      .select("*")
      .gt("date", start)
      .lt("date", end);

    if (sessionError) throw sessionError;
    return sessionData as Session[];
  } catch (error) {
    console.error("Error fetching sessions: ", error);
    throw error;
  }
}
