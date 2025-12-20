"use server";

import { createAdminClient, createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";
import { Profile, CreatedProfileData, Availability } from "@/types";
import { User } from "@supabase/supabase-js";
import { Table } from "../supabase/tables";
import { admin } from "googleapis/build/src/apis/admin";
import { profile } from "console";

interface UserMetadata {
  email: string;
  role: "Student" | "Tutor" | "Admin";
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  age: string;
  grade: string;
  gender: string;
  start_date: string;
  availability: Availability[];
  parent_name: string;
  parent_phone: string;
  parent_email: string;
  phone_number: string;
  timezone: string;
  subjects_of_interest: string[];
  status: "Active";
  student_number: string;
  languages_spoken: string[];
}

// export async function (request: NextRequest) {
//   try {
//     const newProfileData: CreatedProfileData = await request.json();

//     const profileData: Partial<Profile> = await createUser(newProfileData);
//     return profileData
//   } catch (error) {
//     const err = error as Error;
//     console.error(err.message)
//     throw error
//   }
// }

const inviteUser = async (newProfileData: CreatedProfileData) => {
  const supabase = await createClient();
  const { data: authData, error: authError } =
    await supabase.auth.admin.inviteUserByEmail(newProfileData.email, {
      data: {
        first_name: newProfileData.firstName,
        last_name: newProfileData.lastName,
      },
    });

  if (authError) throw new Error(authError.message);
  return authData.user.id;
};

/**
 * Creates a new user through an email invite
 * @param newProfileData
 * @returns
 */

export const createUser = async (newProfileData: CreatedProfileData) => {
  const supabase = await createClient();
  try {
    // Call signUp to create a new user

    // const existingUser: User | undefined = await supabase.auth.admin
    //   .listUsers()
    //   .then(({ data: { users } }) => {
    //     console.log(users);
    //     return users.find((user) => user.email === newProfileData.email);
    //   });

    // const existingUser = await supabase
    //   .from("Profiles")
    //   .select("user_id")
    //   .eq("email", newProfileData.email)
    //   .throwOnError()
    //   .then(({ data: existingUser }) => {
    //     if (existingUser && existingUser.length > 0)
    //       return existingUser[0].user_id;
    //   })

    const { data } = await supabase
      .from("Profiles")
      .select("user_id")
      .eq("email", newProfileData.email)
      .throwOnError();

    const existingUser = data && data.length > 0 ? data[0].user_id : null;

    // console.log("Existing User", existingUser);

    const userId = existingUser ?? (await inviteUser(newProfileData));

    console.log("Auth Data", userId);

    const userMetadata: UserMetadata = {
      email: newProfileData.email,
      role: newProfileData.role,
      user_id: userId,
      first_name: newProfileData.firstName,
      last_name: newProfileData.lastName,
      age: newProfileData.age,
      grade: newProfileData.grade,
      gender: newProfileData.gender,
      start_date: newProfileData.startDate,
      availability: newProfileData.availability,
      parent_name: newProfileData.parentName,
      parent_phone: newProfileData.parentPhone,
      parent_email: newProfileData.parentEmail,
      phone_number: newProfileData.phoneNumber,
      timezone: newProfileData.timezone,
      subjects_of_interest: newProfileData.subjects_of_interest,
      status: newProfileData.status,
      student_number: newProfileData.studentNumber,
      languages_spoken: newProfileData.languages_spoken,
    };

    const { data: createdProfile, error: profileError } = await supabase
      .from("Profiles")
      .insert(userMetadata)
      .select()
      .single();

    if (!existingUser && profileError) {
      // Only delete if this is not another existing user
      await supabase.auth.admin.deleteUser(userId);
      throw profileError;
    }

    const createdProfileData: Profile = {
      id: createdProfile.id, // Assuming 'id' is the generated key
      createdAt: createdProfile.created_at, // Assuming 'created_at' is the generated timestamp
      userId: createdProfile.user_id, // Adjust based on your schema
      role: createdProfile.role,
      firstName: createdProfile.first_name,
      lastName: createdProfile.last_name,
      // dateOfBirth: createdProfile.dateOfBirth,
      startDate: createdProfile.start_date,
      availability: createdProfile.availability,
      email: createdProfile.email,
      phoneNumber: createdProfile.phone_number,
      parentName: createdProfile.parent_name,
      parentPhone: createdProfile.parent_phone,
      parentEmail: createdProfile.parent_email,
      timeZone: createdProfile.time_zone,
      subjects_of_interest: createdProfile.subjects_of_interest,
      languages_spoken: createdProfile.languages_spoken,
      tutorIds: createdProfile.tutor_ids,
      status: createdProfile.status,
      studentNumber: createdProfile.studentNumber,
      settingsId: createdProfile.settings_id,
    };

    return createdProfileData;
  } catch (error) {
    const err = error as Error;
    console.error("Error creating user:", error);
    throw error;
  }
};

const replaceLastActiveProfile = async (
  userId: string,
  lastActiveProfileId: string,
  userProfileIds: { id: string }[]
) => {
  const supabase = await createClient();
  try {
    const availableProfile = userProfileIds.find(
      (profile) => profile.id != lastActiveProfileId
    );
    if (availableProfile === undefined)
      throw new Error(
        "Called replaceLastActiveProfile with only one or zero profileIds attached to userId"
      );

    await supabase
      .from("user_settings")
      .update({ lastActiveProfileId: availableProfile.id })
      .eq("user_id", userId)
      .throwOnError();
  } catch (error) {
    console.error("Unable to replace last active profile", error);
    throw error;
  }
};

export const deleteUser = async (profileId: string) => {
  const adminSupabase = await createAdminClient();

  try {
    const { data: profile, error: fetchError } = await adminSupabase
      .from(Table.Profiles)
      .select("user_id")
      .eq("id", profileId)
      .single()
      .throwOnError();

    const [res1, res2] = await Promise.all([
      adminSupabase
        .from(Table.Profiles)
        .select("id")
        .eq("user_id", profile.user_id)
        .throwOnError(),
      adminSupabase
        .from("user_settings")
        .select(
          `
        user_id,
        last_active_profile_id
        `
        )
        .eq("last_active_profile_id", profileId)
        .maybeSingle()
        .throwOnError(),
    ]);

    const relatedProfiles = res1.data;
    const userSettings = res2.data;

    if (relatedProfiles.length == 1) {
      const { error: authError } = await adminSupabase.auth.admin.deleteUser(
        relatedProfiles[0].id
      );

      if (authError) throw authError;
    } else if (
      userSettings &&
      userSettings.last_active_profile_id == profileId
    ) {
      replaceLastActiveProfile(
        userSettings.user_id,
        userSettings.last_active_profile_id,
        relatedProfiles
      );
    }

    // Delete from profiles table
    await adminSupabase
      .from(Table.Profiles)
      .delete()
      .eq("id", profileId)
      .throwOnError();
  } catch (error: any) {
    console.error("Failed to delete user", error);
    throw error;
  }
};
