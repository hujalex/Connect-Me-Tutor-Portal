import { getSupabase } from "@/lib/supabase-server/serverClient";
import { NextRequest, NextResponse } from "next/server";
import { Profile, CreatedProfileData, Availability } from "@/types";


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

export async function POST(request: NextRequest) {
  try {
    const newProfileData: CreatedProfileData = await request.json();

    const profileData: Profile = await createUser(newProfileData);
    return NextResponse.json(
      { success: true, profileData: profileData },
      { status: 200 }
    );
  } catch (error) {
    const err = error as Error
    return NextResponse.json(
      {
        error: err,
        message: err.message,
      },
      { status: 500 }
    );
  }
}

const createUser = async (
  newProfileData: CreatedProfileData
) => {

  const supabase = await getSupabase(); 
  try {
    // Call signUp to create a new user
    console.log("CREATING USER", newProfileData);



    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: newProfileData.email,
      password: newProfileData.password,
      user_metadata: {
        first_name: newProfileData.firstName,
        last_name: newProfileData.lastName
      },
    });
    
    if (authError) throw Error

    const userMetadata: UserMetadata = {
      email: newProfileData.email,
      role: newProfileData.role,
      user_id: authData.user.id,
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

    const { data: createdProfile, error: profileError} = await supabase.from("Profiles").insert(
        userMetadata
    ).select().single()

    if (profileError) {
        console.log("DELETING USER")
        await supabase.auth.admin.deleteUser(authData.user.id)
        throw profileError
    }

     return {
      id: createdProfile.id, // Assuming 'id' is the generated key
      createdAt: createdProfile.createdAt, // Assuming 'created_at' is the generated timestamp
      userId: createdProfile.userId, // Adjust based on your schema
      role: createdProfile.role,
      firstName: createdProfile.firstName,
      lastName: createdProfile.lastName,
      // dateOfBirth: createdProfile.dateOfBirth,
      startDate: createdProfile.startDate,
      availability: createdProfile.availability,
      email: createdProfile.email,
      phoneNumber: createdProfile.phoneNumber,
      parentName: createdProfile.parentName,
      parentPhone: createdProfile.parentPhone,
      parentEmail: createdProfile.parentEmail,
      timeZone: createdProfile.timeZone,
      subjects_of_interest: createdProfile.subjects_of_interest,
      languages_spoken: createdProfile.languages_spoken,
      tutorIds: createdProfile.tutorIds,
      status: createdProfile.status,
      studentNumber: createdProfile.studentNumber,
      settingsId: createdProfile.settingsId,
    };

  } catch (error) {
    const err = error as Error
    console.error("Error creating user:", err);
    throw error;
  }
};
