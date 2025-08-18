"use client";

import { PairingLog, PairingRequest, SharedPairing } from "@/types/pairing";
import { createClient } from "@supabase/supabase-js";
import { getProfile, getProfileRole, supabase } from "./user.actions";
import { getAccountEnrollments } from "./enrollments.action";
import { Table } from "../supabase/tables";

export const getAllPairingRequests = async (
  profileType: "student" | "tutor"
) => {
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

  const { data, error } = await supabase.rpc("get_all_pairing_requests", {
    p_type: profileType,
  });

  return { data: data as PairingRequest[], error };
};

export const createPairingRequest = async (userId: string, notes: string) => {
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

  const [profile, enrollments] = await Promise.all([
    getProfile(userId),
    getAccountEnrollments(userId),
  ]);

  if (!enrollments) throw new Error("cannot locate account enrollments");
  if (!profile) throw new Error("failed to validate profile role");

  const priority = enrollments.length < 1 ? 1 : 2;

  //Check for current enrollments here to determine assigned priority ranking
  console.log("f -> ", {
    user_id: profile.id,
    type: profile.role.toLowerCase(),
    priority,
    notes,
  });

  const result = await supabase.from(Table.PairingRequests).insert([
    {
      user_id: profile.id,
      type: profile.role.toLowerCase(),
      priority,
      notes,
    },
  ]);

  console.log("creation result: ", result);
};

export const acceptStudentMatch = () => {};

export const getPairingLogs = async (
  start_time: string,
  end_time: string
): Promise<PairingLog[]> => {
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

  const { data: logs, error } = await supabase.rpc("get_pairing_logs", {
    start_time,
    end_time,
  });

  return logs;
};

export const getPairingFromEnrollmentId = async (enrollmentId: string) => {
  try {
    console.log(enrollmentId);
    const { data, error } = await supabase
      .from("Enrollments")
      .select("pairing_id")
      .eq("pairing_id", enrollmentId)
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
}
