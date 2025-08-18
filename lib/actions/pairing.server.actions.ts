import { Meeting } from "@/types";
import { createClient } from "@supabase/supabase-js";

export const getPairingFromEnrollmentId = async (enrollmentId: string) => {
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
    const { data, error } = await supabase
      .from("Enrollments")
      .select("pairing_id")
      .eq("id", enrollmentId)
      .single();
    if (error) throw error;
    console.log(data);
    return data.pairing_id;
  } catch (error) {
    console.error("Unable to get pairing from enrollment", error);
    throw error;
  }
};
