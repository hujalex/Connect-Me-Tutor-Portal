"use server";

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

export const deleteAllPairingRequests = async () => {
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

    // Delete all rows from pairing_requests
    const { error: pairingRequestsError } = await supabase
      .from("pairing_requests")
      .delete()
      .not("id", "is", null);

    if (pairingRequestsError) {
      console.error("Error deleting pairing_requests:", pairingRequestsError);
    } else {
      console.log("All rows deleted from pairing_requests successfully");
    }

    // Delete all rows from pairing_matches
    const { error: pairingMatchesError } = await supabase
      .from("pairing_matches")
      .delete()
      .not("id", "is", null);

    if (pairingMatchesError) {
      console.error("Error deleting pairing_matches:", pairingMatchesError);
    } else {
      console.log("All rows deleted from pairing_matches successfully");
    }

    // Delete all rows from pairing_logs
    const { error: pairingLogsError } = await supabase
      .from("pairing_logs")
      .delete()
      .not("id", "is", null);

    if (pairingLogsError) {
      console.error("Error deleting pairing_logs:", pairingLogsError);
    } else {
      console.log("All rows deleted from pairing_logs successfully");
    }
  } catch (err: any) {
    console.error(err.message);
  }
};

export const resetPairingQueues = async () => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error("Missing Supabase environment variables");
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );
  const { error } = await supabase
    .from("pairing_requests")
    .update({ status: "pending" })
    .not("id", "is", null); // forces Supabase to delete all rows

  if (error) {
    console.error("Error deleting rows:", error);
  } else {
    console.log("All rows deleted successfully");
  }
};
