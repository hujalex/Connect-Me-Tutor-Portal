import { getSupabase } from "@/lib/supabase-server/serverClient";
import { NextRequest, NextResponse } from "next/server";
import { Profile, CreatedProfileData, Availability } from "@/types";

interface UserMetadata {
  role: "Student" | "Tutor" | "Admin";
  first_name: string;
  last_name: string;
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

export async function POST(request: NextRequest) {
  try {
    const newProfileData: CreatedProfileData = await request.json();

    const userId = await createUser(newProfileData);
    return NextResponse.json(
      { success: true, userId: userId },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        error: error,
      },
      { status: 500 }
    );
  }
}

const createUser = async (
  newProfileData: CreatedProfileData
): Promise<string | null> => {
  try {
    // Call signUp to create a new user
    console.log("CREATING USER", newProfileData);
    const supabase = await getSupabase();

    const userMetadata: UserMetadata = {
      role: newProfileData.role,
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

    const { data, error } = await supabase.auth.admin.createUser({
      email: newProfileData.email,
      password: newProfileData.password,
      user_metadata: userMetadata,
    });

    if (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }

    // Return the user ID
    return data?.user?.id || null; // Use optional chaining to safely access id
  } catch (error) {
    console.error("Error creating user:", error);
    return null; // Return null if there was an error
  }
};
