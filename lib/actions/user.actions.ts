import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Profile } from "@/types";

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/**
 * Fetches all profiles based on a given role, with optional ordering.
 *
 * @param role - The role of the profiles to fetch ("Student", "Tutor", or "Admin")
 * @param orderBy - Optional. The field to order the profiles by.
 * @param ascending - Optional. Boolean indicating if the order should be ascending (true) or descending (false)
 * @returns A promise that resolves to an array of Profile objects or null if an error occurs or no profiles are found.
 */
export async function getAllProfiles(
  role: "Student" | "Tutor" | "Admin",
  orderBy?: string | null,
  ascending?: boolean | null
): Promise<Profile[] | null> {
  try {
    const profileFields = `
      id,
      created_at,
      role,
      user_id,
      age,
      grade,
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
      student_number
    `;

    // Build query
    let query = supabase
      .from("Profiles")
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
      console.log("No profiles found");
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
      firstName: profile.first_name,
      lastName: profile.last_name,
      dateOfBirth: profile.date_of_birth,
      startDate: profile.start_date,
      availability: profile.availability,
      email: profile.email,
      parentName: profile.parent_name,
      parentPhone: profile.parent_phone,
      parentEmail: profile.parent_email,
      tutorIds: profile.tutor_ids,
      timeZone: profile.timezone,
      subjectsOfInterest: profile.subjects_of_interest,
      status: profile.status,
      studentNumber: profile.student_number,
    }));

    return userProfiles;
  } catch (error) {
    console.error("Unexpected error in getProfile:", error);
    return null;
  }
}

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
      .from("Profiles")
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
        student_number
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
    };

    console.log("Mapped profile data:", userProfile);
    return userProfile;
  } catch (error) {
    console.error("Unexpected error in getProfile:", error);
    return null;
  }
};

export const getProfileByEmail = async (email: string) => {
  const { data, error } = await supabase
    .from("Profiles")
    .select()
    .eq("email", email)
    .single();
  if (error) throw new Error(`Profile fetch failed: ${error.message}`);
  if (!data) throw new Error(`No Profile found for email ${email}`);

  return data;
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
      .from("Profiles")
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
      .from("Profiles")
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
        student_number
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
    };

    console.log("Mapped profile data:", userProfile);
    return userProfile;
  } catch (error) {
    console.error("Unexpected error in getProfile:", error);
    return null;
  }
};

/**
 * Fetches a user profile from the database by its ID.
 *
 * @param profileId - The ID of the profile to fetch.
 * @returns A promise that resolves to the Profile object or null if not found or an error occurs.
 */
export async function getProfileWithProfileId(
  profileId: string
): Promise<Profile | null> {
  try {
    const { data, error } = await supabase
      .from("Profiles")
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
        student_number
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
    };

    console.log("Mapped profile data:", userProfile);
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

/**
 * Creates a new user in the Supabase authentication system.
 *
 * @param email - The email address for the new user.
 * @param password - The password for the new user.
 * @returns A promise that resolves to the new user's ID, or null if creation fails.
 * @throws Will throw an error if Supabase auth.signUp fails.
 */
export const createUser = async (
  email: string,
  password: string
): Promise<string | null> => {
  try {
    // Call signUp to create a new user
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}`,
      },
    });

    if (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }

    console.log("User created successfully:", data);

    // Return the user ID
    return data?.user?.id || null; // Use optional chaining to safely access id
  } catch (error) {
    console.error("Error creating user:", error);
    return null; // Return null if there was an error
  }
};

/**
 * Deletes a user by making a POST request to the delete-user API endpoint.
 *
 * @param profileId - The ID of the profile associated with the user to be deleted.
 * @returns A promise that resolves to the JSON response from the API.
 * @throws Will throw an error if the API request fails or returns an error.
 */
export async function deleteUser(profileId: string) {
  try {
    const response = await fetch("/api/admin/delete-user", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ profileId }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || "Failed to delete user");
    }

    return await response.json();
  } catch (error) {
    console.error("Error deleting user:", error);
    throw error;
  }
}

/**
 * Updates an existing user's profile information in the database.
 *
 * @param profile - The Profile object containing the updated information. The ID field is used to identify the user.
 * @returns A promise that resolves to the updated profile data from Supabase.
 * @throws Will throw an error if the update operation fails.
 */
export async function editUser(profile: Profile) {
  console.log(profile);
  const {
    id,
    role,
    firstName,
    lastName,
    age,
    grade,
    gender,
    email,
    dateOfBirth,
    startDate,
    parentName,
    parentPhone,
    parentEmail,
    timeZone,
    subjectsOfInterest,
    studentNumber,
  } = profile;
  try {
    const { data, error } = await supabase
      .from("Profiles")
      .update({
        role: role,
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        age: age,
        grade: grade,
        gender: gender,
        email: email,
        date_of_birth: dateOfBirth,
        start_date: startDate,
        parent_name: parentName,
        parent_email: parentEmail,
        parent_phone: parentPhone,
        timezone: timeZone,
        student_number: studentNumber,
        subjects_of_interest: subjectsOfInterest,
      })
      .eq("id", id)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error updating user", error);
    throw new Error("Unable to edit User");
  }
}

/**
 * Deactivates a user by setting their profile status to "Inactive".
 *
 * @param profileId - The ID of the profile to deactivate.
 * @returns A promise that resolves to the updated profile data.
 * @throws Will throw an error if the update fails.
 */
export async function deactivateUser(profileId: string) {
  try {
    const { data, error } = await supabase
      .from("Profiles")
      .update({ status: "Inactive" })
      .eq("id", profileId)
      .select("*")
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error deactivating user:", error);
    throw error;
  }
}

/**
 * Reactivates a user by setting their profile status to "Active".
 *
 * @param profileId - The ID of the profile to reactivate.
 * @returns A promise that resolves to the updated profile data.
 * @throws Will throw an error if the update fails.
 */
export async function reactivateUser(profileId: string) {
  try {
    const { data, error } = await supabase
      .from("Profiles")
      .update({ status: "Active" })
      .eq("id", profileId)
      .select("*")
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error reactivating user:", error);
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
