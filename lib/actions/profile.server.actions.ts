"use server";

import { Profile } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { Table } from "../supabase/tables";

import axios from "axios";
import { supabase } from "../supabase/client";
import { getSupabase } from "../supabase-server/serverClient";
import { revalidatePath } from "next/cache";

export const switchProfile = async (userId: string, profileId: string) => {
  try {
    const supabase = await createClient();
    await supabase
      .from("user_settings")
      .update({ last_active_profile_id: profileId })
      .eq("user_id", userId)
      .throwOnError();
  } catch (error) {
    throw error;
  }
};

export const getUserProfiles = async (userId: string) => {
  try {
    const { data } = await supabase
      .from("Profiles")
      .select(
        `
          id,
          first_name,
          last_name,
          email
          `
      )
      .eq("user_id", userId)
      .throwOnError();

    const profiles: Partial<Profile>[] = data.map((profile) => ({
      id: profile.id,
      firstName: profile.first_name,
      lastName: profile.last_name,
    }));
    return profiles;
  } catch (error) {
    console.error("Unable to get user profiles", error);
    throw error;
  }
};
