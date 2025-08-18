import { Meeting } from "@/types";
import { SharedPairing } from "@/types/pairing";
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

export async function getAccountPairings(userId: string) {
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
    const { data, error } = await supabase.rpc(
      "get_user_pairings_with_profiles",
      {
        requestor_auth_id: userId,
      }
    );

    if (error) {
      console.error("Error fetching enrollments:", error);
      return null;
    }

    return data as SharedPairing[];
  } catch (error) {
    console.error("Unable to get account pairings", error);
    throw error;
  }
}
