import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Profile } from "@/types";
import { Table } from "../supabase/tables";

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export const getUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null; // Return null if no user or error occurs
  }
  return user;
};

export const getProfile = async (userId: string): Promise<Profile | null> => {
  if (!userId) {
    console.error("User ID is required to fetch profile data");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(Table.Profiles)
      .select(
        `
        id,
        created_at,
        role,
        user_id,
        first_name,
        last_name,
        date_of_birth,
        start_date,
        availability,
        email,
        parent_name,
        parent_phone,
        parent_email,
        tutor_ids,
        timezone,
        subjects_of_interest,
        status,
        student_number,
        settings_id
      `
      )
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error("Error fetching profile in getProfile:", error.message);
      console.error("Error details:", error);
      return null;
    }

    if (!data) {
      console.log("No profile found for user ID:", userId);
      return null;
    }

    // Mapping the fetched data to the UserProfile object
    const userProfile: Profile = {
      id: data.id,
      createdAt: data.created_at,
      role: data.role,
      userId: data.user_id,
      firstName: data.first_name,
      lastName: data.last_name,
      dateOfBirth: data.date_of_birth,
      startDate: data.start_date,
      availability: data.availability, // Assuming the data is stored as JSON
      email: data.email,
      parentName: data.parent_name,
      parentPhone: data.parent_phone,
      parentEmail: data.parent_email,
      tutorIds: data.tutor_ids,
      timeZone: data.timezone,
      subjectsOfInterest: data.subjects_of_interest,
      status: data.status,
      studentNumber: data.student_number,
      settingsId: data.settings_id,
    };

    return userProfile;
  } catch (error) {
    console.error("Unexpected error in getProfile:", error);
    return null;
  }
};

export const getProfileByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from(Table.Profiles)
    .select("*")
    .eq("email", email)
    .single();
  if (error) throw new Error(`Profile fetch failed: ${error.message}`);
  if (!data) throw new Error(`No Profile found for email ${email}`);

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
    parentName: data.parent_name,
    parentPhone: data.parent_phone,
    tutorIds: data.tutor_ids,
    parentEmail: data.parent_email,
    timeZone: data.timezone,
    subjectsOfInterest: data.subjects_of_interest,
    status: data.status,
    studentNumber: data.student_number,
    settingsId: data.settings_id,
  };

  return userProfile;
};

export const getProfileRole = async (
  userId: string
): Promise<string | null> => {
  if (!userId) {
    console.error("User ID is required to fetch profile role");
    return null;
  }

  try {
    const { data, error } = await supabase
      .from(Table.Profiles)
      .select("role")
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error(
        "Error fetching profile role in getProfileRole:",
        error.message
      );
      console.error("Error details:", error);
      return null;
    }

    console.log("Fetched profile data:", data);

    if (!data) {
      console.log("No profile found for user ID:", userId);
      return null;
    }

    return data.role || null;
  } catch (error) {
    console.error("Unexpected error in getProfileRole:", error);
    return null;
  }
};

export const getSessionUserProfile = async (): Promise<Profile | null> => {
  const user = await getUser();
  const userId = user?.id;

  try {
    const { data, error } = await supabase
      .from(Table.Profiles)
      .select(
        `
        id,
        created_at,
        role,
        user_id,
        first_name,
        last_name,
        date_of_birth,
        start_date,
        availability,
        email,
        parent_name,
        parent_phone,
        parent_email,
        tutor_ids,
        timezone,
        subjects_of_interest,
        status,
        student_number,
        settings_id
      `
      )
      .eq("user_id", userId)
      .single();

    if (error) {
      console.error(
        "Error fetching profile in getSessionUserProfile:",
        error.message
      );
      console.error("Error details:", error);
      return null;
    }

    if (!data) {
      console.log("No profile found for user ID:", userId);
      return null;
    }

    // Mapping the fetched data to the UserProfile object
    const userProfile: Profile = {
      id: data.id,
      createdAt: data.created_at,
      role: data.role,
      userId: data.user_id,
      firstName: data.first_name,
      lastName: data.last_name,
      dateOfBirth: data.date_of_birth,
      startDate: data.start_date,
      availability: data.availability, // Assuming the data is stored as JSON
      email: data.email,
      parentName: data.parent_name,
      parentPhone: data.parent_phone,
      parentEmail: data.parent_email,
      tutorIds: data.tutor_ids,
      timeZone: data.timezone,
      subjectsOfInterest: data.subjects_of_interest,
      status: data.status,
      studentNumber: data.student_number,
      settingsId: data.settings_id,
    };

    return userProfile;
  } catch (error) {
    console.error("Unexpected error in getProfile:", error);
    return null;
  }
};

export async function getProfileWithProfileId(
  profileId: string
): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from(Table.Profiles)
      .select(
        `
        id,
        created_at,
        role,
        user_id,
        first_name,
        last_name,
        date_of_birth,
        start_date,
        availability,
        email,
        parent_name,
        parent_phone,
        parent_email,
        tutor_ids,
        timezone,
        subjects_of_interest,
        status,
        student_number,
        settings_id
      `
      )
      .eq("id", profileId)
      .single();

    if (error) {
      console.error(
        "Error fetching profile in getProfileWithProfileId:",
        error.message
      );
      console.error("Error details:", error);
      return null;
    }

    if (!data) {
      console.log("No profile found for user ID:", profileId);
      return null;
    }

    // Mapping the fetched data to the Profile object
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
      parentName: data.parent_name,
      parentPhone: data.parent_phone,
      tutorIds: data.tutor_ids,
      parentEmail: data.parent_email,
      timeZone: data.timezone,
      subjectsOfInterest: data.subjects_of_interest,
      status: data.status,
      studentNumber: data.student_number,
      settingsId: data.settings_id,
    };

    return userProfile;
  } catch (error) {
    console.error("Unexpected error in getProfile:", error);
    return null;
  }
}

export async function getUserInfo() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null; // Return null if no user or error occurs
  }
  return user;
}

export async function updateProfile(userId: string, profileData: any) {
  try {
    const { data, error } = await supabase
      .from(Table.Profiles)
      .update(profileData)
      .eq("user_id", userId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating profile:", error);
    throw error;
  }
}

export async function createUser(userData: any) {
  try {
    const { data, error } = await supabase.auth.admin.createUser({
      email: userData.email,
      password: userData.password,
      email_confirm: true,
    });

    if (error) throw error;

    // If you need to store additional user data, you can do it here
    const { data: profileData, error: profileError } = await supabase
      .from(Table.Profiles)
      .insert({
        user_id: data.user.id,
        ...userData,
      })
      .single();

    if (profileError) throw profileError;

    return { user: data.user, profile: profileData };
  } catch (error) {
    console.error("Error creating user:", error);
    throw error;
  }
}

export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error logging out:", error.message);
    } else {
      console.log("User logged out successfully");
    }
  } catch (error) {
    console.error("Unexpected error logging out:", error);
  }
};
