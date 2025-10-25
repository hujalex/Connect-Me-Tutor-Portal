"use client";
import { Profile } from "@/types";
import { createClient } from "@supabase/supabase-js";
import { supabase } from "../supabase/client";
import { Table } from "../supabase/tables";

import axios from "axios";

interface UpdateProfileInput {
  userId: string;
  availability?: { day: string; startTime: string; endTime: string }[];
  subjectsOfInterest?: string[];
  languagesSpoken?: string[]; // Make sure this exists in your DB
}

export type ProfilePairingMetadata = UpdateProfileInput;

export async function updateProfileDetails({
  userId,
  availability,
  subjectsOfInterest,
  languagesSpoken,
}: UpdateProfileInput): Promise<{ success: boolean; error?: string }> {
  const updates: Record<string, any> = {};
  if (availability !== undefined) updates.availability = availability;
  if (subjectsOfInterest !== undefined)
    updates.subjects_of_interest = subjectsOfInterest;
  if (languagesSpoken !== undefined) updates.languages_spoken = languagesSpoken;

  const updatedSubjects = updates["subjects_of_interest"] as string[];
  if (updatedSubjects) {
    console.log(updatedSubjects);
    const { data } = await axios.post("/api/pairing/embeds", {
      subjects: updatedSubjects,
    });
    if (data.embed) updates["subject_embed"] = data.embed;
  }

  console.log(updates);

  const { error } = await supabase
    .from(Table.Profiles)
    .update(updates)
    .eq("user_id", userId);

  if (error) {
    console.error("Error updating profile:", error.message);
    return { success: false, error: error.message };
  }

  return { success: true };
}
