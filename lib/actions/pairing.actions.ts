"use clietn";

import { PairingRequest } from "@/types/pairing";
import { createClient } from "@supabase/supabase-js";
import { getProfileRole } from "./user.actions";

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

  const role = await getProfileRole(userId);

  if (!role) throw new Error("failed to located profile");

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  //Check for current enrollments here to determine assigned priority ranking
  const result = supabase.from("pairing_request").insert([
    {
      userId,
      type: role.toLowerCase(),
      priority: 1,
    },
  ]);

  return result;
};
