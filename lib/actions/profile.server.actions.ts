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


export async function getAllProfiles(
  role: "Student" | "Tutor" | "Admin",
  orderBy?: string | null,
  ascending?: boolean | null
): Promise<Profile[] | null> {
  
  const supabase = await createClient()

  try {
    const profileFields = `
      id,
      created_at,
      role,
      user_id,
      age,
      grade,
      gender,
      first_name,
      last_name,
      date_of_birth,
      start_date,
      availability,
      email,
      phone_number,
      parent_name,
      parent_phone,
      parent_email,
      tutor_ids,
      timezone,
      subjects_of_interest,
      languages_spoken,
      status,
      student_number,
      settings_id
    `;

    // Build query
    let query = supabase
      .from(Table.Profiles)
      .select(profileFields)
      .eq("role", role);

    // Add ordering if provided
    if (orderBy && ascending !== null) {
      query = query.order(orderBy, { ascending });
    }

    // Execute query
    const { data, error } = await query;

    if (error) {
      console.error("Error fetching profiles:", error.message);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    // Map database fields to camelCase Profile model
    const userProfiles: Profile[] = data.map((profile) => ({
      id: profile.id,
      createdAt: profile.created_at,
      role: profile.role,
      userId: profile.user_id,
      age: profile.age,
      grade: profile.grade,
      gender: profile.gender,
      firstName: profile.first_name,
      lastName: profile.last_name,
      dateOfBirth: profile.date_of_birth,
      startDate: profile.start_date,
      availability: profile.availability,
      email: profile.email,
      phoneNumber: profile.phone_number,
      parentName: profile.parent_name,
      parentPhone: profile.parent_phone,
      parentEmail: profile.parent_email,
      tutorIds: profile.tutor_ids,
      timeZone: profile.timezone,
      subjectsOfInterest: profile.subjects_of_interest,
      status: profile.status,
      studentNumber: profile.student_number,
      settingsId: profile.settings_id,
      subjects_of_interest: profile.subjects_of_interest,
      languages_spoken: profile.languages_spoken,
    }));

    return userProfiles;
  } catch (error) {
    console.error("Unexpected error in getProfile:", error);
    return null;
  }
}