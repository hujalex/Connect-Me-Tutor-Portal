import { Profile } from "@/types";

export async function tableToIntefaceProfiles(data: any) {
  try {
    if (!data) {
      console.warn("Profile is null");
      return null;
    }

    const userProfile: Profile = {
      id: data.id,
      createdAt: data.created_at,
      role: data.role,
      userId: data.user_id,
      firstName: data.first_name,
      lastName: data.last_name,
      dateOfBirth: data.date_of_birth,
      startDate: data.start_date,
      availability: data.availability,
      email: data.email,
      phoneNumber: data.phone_number,
      parentName: data.parent_name,
      parentPhone: data.parent_phone,
      tutorIds: data.tutor_ids,
      parentEmail: data.parent_email,
      timeZone: data.timezone,
      subjects_of_interest: data.subjects_of_interest,
      languages_spoken: data.languages_spoken,
      status: data.status,
      studentNumber: data.student_number,
      settingsId: data.settings_id,
    };
    return userProfile;
  } catch (error) {
    console.error("Unable to convert to interface for Profiles", error);
    throw error;
  }
}
