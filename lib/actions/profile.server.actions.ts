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
