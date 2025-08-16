"use client";

import { PairingRequest } from "@/types/pairing";
import { createClient } from "@supabase/supabase-js";
import { getProfile, getProfileRole } from "./user.actions";
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
