// lib/admins.actions.ts

// lib/student.actions.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Profile,
  Session,
  Notification,
  Event,
  Enrollment,
  Meeting,
} from "@/types";
import { getProfileWithProfileId, getProfileByEmail } from "./user.actions";
import {
  addDays,
  format,
  parse,
  parseISO,
  isBefore,
  isAfter,
  areIntervalsOverlapping,
  addHours,
  isValid,
  setHours,
  setMinutes,
} from "date-fns"; // Only use date-fns
import ResetPassword from "@/app/(public)/set-password/page";
import { getStudentSessions } from "./student.actions";
import toast from "react-hot-toast";
// import { getMeeting } from "./meeting.actions";

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/* PROFILES */

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

/**
 * Adds a new student profile to the database.
 * This involes creating an authenticated user first, then their profile.
 *
 * @param studentData - Partial data for the new studnet profile. Email is required
 * @returns A promise that resolves to the new created Profile object.
 * @throws Will throw an error if email is missing, user already exists, or database insertion fails.
 */
export const addStudent = async (
  studentData: Partial<Profile>
): Promise<Profile> => {
  const supabase = createClientComponentClient();

  try {
    console.log(studentData);

    if (!studentData.email) {
      throw new Error("Email is required to create a student profile");
    }

    const lower_case_email = studentData.email.toLowerCase().trim();

    // Check if a user with this email already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from("Profiles")
      .select("user_id")
      .eq("email", lower_case_email);

    if (userCheckError && userCheckError.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is what we want
      throw userCheckError;
    }

    if (existingUser && existingUser.length > 0) {
      throw new Error("A user with this email already exists");
    }

    //-----Moved After Duplicate Check to prevent Sending confimration email-----
    const tempPassword = await createPassword();
    const userId = await createUser(lower_case_email, tempPassword);

    // Create the student profile without id and createdAt
    const newStudentProfile = {
      user_id: userId,
      role: "Student",
      first_name: studentData.firstName ? studentData.firstName.trim() : "",
      last_name: studentData.lastName ? studentData.lastName.trim() : "",
      age: studentData.age || "",
      grade: studentData.grade || "",
      gender: studentData.gender || "",
      // date_of_birth: studentData.dateOfBirth || "",
      start_date: studentData.startDate || new Date().toISOString(),
      availability: studentData.availability || [],
      email: lower_case_email,
      parent_name: studentData.parentName || "",
      parent_phone: studentData.parentPhone || "",
      parent_email: studentData.parentEmail || "",
      timezone: studentData.timeZone || "",
      subjects_of_interest: studentData.subjectsOfInterest || [],
      tutor_ids: [], // Changed from tutorIds to tutor_ids
      status: "Active",
      student_number: studentData.studentNumber,
    };

    // Add student profile to the database
    const { data: profileData, error: profileError } = await supabase
      .from("Profiles") // Ensure 'profiles' is correctly cased
      .insert(newStudentProfile)
      .select("*");

    if (profileError) throw profileError;

    // Ensure profileData is defined and cast it to the correct type
    if (!profileData) {
      throw new Error("Profile data not returned after insertion");
    }

    // Type assertion to ensure profileData is of type Profile
    const createdProfile: any = profileData;

    // Return the newly created profile data, including autogenerated fields
    return {
      id: createdProfile.id, // Assuming 'id' is the generated key
      createdAt: createdProfile.createdAt, // Assuming 'created_at' is the generated timestamp
      userId: createdProfile.userId, // Adjust based on your schema
      role: createdProfile.role,
      firstName: createdProfile.firstName,
      lastName: createdProfile.lastName,
      age: createdProfile.age,
      grade: createdProfile.grade,
      gender: createdProfile.gender,
      // dateOfBirth: createdProfile.dateOfBirth,
      startDate: createdProfile.startDate,
      availability: createdProfile.availability,
      email: createdProfile.email,
      parentName: createdProfile.parentName,
      parentPhone: createdProfile.parentPhone,
      parentEmail: createdProfile.parentEmail,
      timeZone: createdProfile.timeZone,
      subjectsOfInterest: createdProfile.subjectsOfInterest,
      tutorIds: createdProfile.tutorIds,
      status: createdProfile.status,
      studentNumber: createdProfile.studentNumber,
    };
  } catch (error) {
    console.error("Error adding student:", error);
    throw error;
  }
};

/**
 * Adds a new tutor profile to the database.
 * This involves creating an authenticated user first, then their profile.
 *
 * @param tutorData - Partial data for the new tutor profile. Email is required.
 * @returns A promise that resolves to the newly created Profile object.
 * @throws Will throw an error if email is missing, user already exists, or database insertion fails.
 */
export const addTutor = async (
  tutorData: Partial<Profile>
): Promise<Profile> => {
  const supabase = createClientComponentClient();
  try {
    console.log(tutorData);
    if (!tutorData.email) {
      throw new Error("Email is required to create a student profile");
    }

    const lowerCaseEmail = tutorData.email.toLowerCase().trim();

    // Check if a user with this email already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from("Profiles")
      .select("user_id")
      .eq("email", lowerCaseEmail);

    if (userCheckError && userCheckError.code !== "PGRST116") {
      // PGRST116 means no rows returned, which is what we want
      throw userCheckError;
    }

    if (existingUser && existingUser.length > 0) {
      throw new Error("A user with this email already exists");
    }

    //-----Moved After Duplicate Check to prevent Sending confimration email-----
    const tempPassword = await createPassword();
    const userId = await createUser(lowerCaseEmail, tempPassword);

    // Create the student profile without id and createdAt
    const newTutorProfile = {
      user_id: userId,
      role: "Tutor",
      first_name: tutorData.firstName ? tutorData.firstName.trim() : "",
      last_name: tutorData.lastName ? tutorData.lastName.trim() : "",
      date_of_birth: tutorData.dateOfBirth || "",
      start_date: tutorData.startDate || new Date().toISOString(),
      availability: tutorData.availability || [],
      email: lowerCaseEmail,
      timezone: tutorData.timeZone || "",
      subjects_of_interest: tutorData.subjectsOfInterest || [],
      tutor_ids: [], // Changed from tutorIds to tutor_ids
      status: "Active",
      student_number: null,
    };

    // Add tutor profile to the database
    const { data: profileData, error: profileError } = await supabase
      .from("Profiles") // Ensure 'profiles' is correctly cased
      .insert(newTutorProfile)
      .select("*");

    if (profileError) throw profileError;

    // Ensure profileData is defined and cast it to the correct type
    if (!profileData) {
      throw new Error("Profile data not returned after insertion");
    }

    // Type assertion to ensure profileData is of type Profile
    const createdProfile: any = profileData;

    // Return the newly created profile data, including autogenerated fields
    return {
      id: createdProfile.id, // Assuming 'id' is the generated key
      createdAt: createdProfile.createdAt, // Assuming 'created_at' is the generated timestamp
      userId: createdProfile.userId, // Adjust based on your schema
      role: createdProfile.role,
      firstName: createdProfile.firstName,
      lastName: createdProfile.lastName,
      dateOfBirth: createdProfile.dateOfBirth,
      startDate: createdProfile.startDate,
      availability: createdProfile.availability,
      email: createdProfile.email,
      parentName: createdProfile.parentName,
      parentPhone: createdProfile.parentPhone,
      parentEmail: createdProfile.parentEmail,
      timeZone: createdProfile.timeZone,
      subjectsOfInterest: createdProfile.subjectsOfInterest,
      tutorIds: createdProfile.tutorIds,
      status: createdProfile.status,
      studentNumber: createdProfile.student_number,
    };
  } catch (error) {
    console.error("Error adding student:", error);
    throw error;
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
 * Fetches a user profile from the database by its ID.
 *
 * @param profileId - The ID of the profile to fetch.
 * @returns A promise that resolves to the Profile object or null if not found or an error occurs.
 */
export async function getUserFromId(profileId: string) {
  try {
    const { data: profile, error } = await supabase
      .from("Profiles")
      .select(
        `
          id,
          created_at,
          role,
          user_id,
          first_name,
          last_name,
          age,
          grade,
          gender,
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
      throw error;
    }
    if (!profile) return null;

    const userProfile = {
      id: profile.id,
      createdAt: profile.created_at,
      role: profile.role,
      userId: profile.user_id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      age: profile.age,
      grade: profile.grade,
      gender: profile.gender,
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
    };
    return userProfile;
  } catch (error) {
    console.error("Failed to fetch user");
    return null;
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
 * Resends an email confirmation link to the specified email address.
 *
 * @param email - The email address to resend the confirmation to.
 * @returns A promise that resolves if the request is successful.
 * @throws Will throw an error if the resend operation fails.
 */
export const resendEmailConfirmation = async (email: string) => {
  try {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: email,
      options: {
        emailRedirectTo: `${window.location.origin}`,
      },
    });
    if (error) throw error;
  } catch (error) {
    console.error("Failed to resend Email Confirmation", error);
    throw error;
  }
};

/**
 * Creates a new session record in the database.
 *
 * @param sessionData - An object containing the data for the new session.
 *                      Expected to match the structure of the "Sessions" table.
 * @returns A promise that resolves to the newly created session data.
 * @throws Will throw an error if the database insertion fails.
 */
export async function createSession(sessionData: any) {
  const { data, error } = await supabase
    .from("Sessions")
    .insert(sessionData)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetches all sessions, optionally filtered by a date range and ordered.
 *
 * @param startDate - Optional. ISO string for the start date of the filter range.
 * @param endDate - Optional. ISO string for the end date of the filter range.
 * @param orderBy - Optional. The field to order the sessions by.
 * @param ascending - Optional. Boolean indicating if the order should be ascending.
 * @returns A promise that resolves to an array of Session objects. Returns an empty array on error.
 */
export async function getAllSessions(
  startDate?: string,
  endDate?: string,
  orderBy?: string,
  ascending?: boolean
): Promise<Session[]> {
  try {
    let query = supabase.from("Sessions").select(`
      id,
      created_at,
      environment,
      student_id,
      tutor_id,
      date,
      summary,
      meeting_id,
      status,
      is_question_or_concern,
      is_first_session,
      session_exit_form
    `);

    if (startDate) {
      query = query.gte("date", startDate);
    }
    if (endDate) {
      query = query.lte("date", endDate);
    }

    if (orderBy && ascending !== undefined) {
      query = query.order(orderBy, { ascending });
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching student sessions:", error.message);
      throw error;
    }

    // Map the result to the Session interface
    const sessions: Session[] = await Promise.all(
      data.map(async (session: any) => ({
        id: session.id,
        createdAt: session.created_at,
        environment: session.environment,
        date: session.date,
        summary: session.summary,
        // meetingId: session.meeting_id,
        meeting: await getMeeting(session.meeting_id),
        student: await getProfileWithProfileId(session.student_id),
        tutor: await getProfileWithProfileId(session.tutor_id),
        status: session.status,
        session_exit_form: session.session_exit_form,
        isQuestionOrConcern: Boolean(session.is_question_or_concern),
        isFirstSession: Boolean(session.is_first_session),
      }))
    );

    console.log(sessions);

    return sessions;
  } catch (error) {
    console.error("Error fetching sessions");
    return [];
  }
}

/**
 * Reschedules an existing session by updating its date.
 *
 * @param sessionId - The ID of the session to reschedule.
 * @param newDate - The new ISO string date for the session.
 * @returns A promise that resolves to the updated session data.
 * @throws Will throw an error if the update operation fails.
 */
export async function rescheduleSession(sessionId: string, newDate: string) {
  const { data, error } = await supabase
    .from("Sessions")
    .update({ date: newDate })
    .eq("id", sessionId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Generates a set of unique string keys for sessions.
 * Each key is typically formed from student ID, tutor ID, and formatted session date.
 * If no session data is provided, it attempts to fetch all sessions.
 *
 * @param data - Optional. An array of Session objects to generate keys from.
 * @returns A promise that resolves to a Set of unique session keys (strings).
 * @throws Will throw an error if fetching sessions fails (when data is not provided).
 */
export async function getSessionKeys(data?: Session[]) {
  const sessionKeys: Set<string> = new Set();

  if (!data) {
    const { data, error } = await supabase
      .from("Sessions")
      .select("student_id, tutor_id, date");

    if (error) {
      console.error("Error fetching sessions:", error);
      throw error;
    }
  }

  if (!data) return sessionKeys;

  data.forEach((session) => {
    if (session.date) {
      const sessionDate = new Date(session.date);
      const key = `${session.student?.id}-${session.tutor?.id}-${format(
        sessionDate,
        "yyyy-MM-dd-HH:mm"
      )}`;
      sessionKeys.add(key);
    }
  });

  return sessionKeys;
}

/**
 * Checks if a meeting is available at the requested session time by comparing against existing sessions.
 *
 * @param meetingId - ID of the meeting to check.
 * @param sessionId - ID of the current session (to exclude from conflicts if updating). Undefined if creating a new session.
 * @param sessionDate - ISO string date of the requested session.
 * @param existingSessions - Array of all sessions to check for conflicts.
 * @returns A promise that resolves to boolean - True if the meeting is available, false otherwise or on error.
 */
export async function isMeetingAvailable(
  meetingId: string,
  sessionId: string | undefined,
  sessionDate: string,
  existingSessions: Session[]
): Promise<boolean> {
  try {
    // Check if the session date is valid
    if (!sessionDate || !isValid(parseISO(sessionDate))) {
      console.error("Invalid session date provided");
      return false;
    }

    // Calculate session time range
    const sessionStartTime = parseISO(sessionDate);
    const sessionEndTime = addHours(sessionStartTime, 1);

    // Check for conflicts with existing sessions
    const hasConflict = existingSessions.some(
      (existingSession) =>
        // Don't check against the same session we're updating
        sessionId !== existingSession.id &&
        // Check if the meeting ID matches
        existingSession.meeting?.id === meetingId &&
        // Check for time overlap
        areIntervalsOverlapping(
          { start: sessionStartTime, end: sessionEndTime },
          {
            start: parseISO(existingSession.date),
            end: addHours(parseISO(existingSession.date), 1),
          }
        )
    );

    // Return true if no conflicts found
    return !hasConflict;
  } catch (error) {
    console.error("Error checking meeting availability:", error);
    return false; // Default to unavailable on error
  }
}

/**
 * (Placeholder) Applies a SQL query to check if an individual meeting is available.
 * This function is currently not implemented.
 *
 * @param meetingId - The ID of the meeting.
 * @param session - The session context for which availability is checked.
 * @returns A promise that resolves to void.
 */
export async function isSingleMeetingAvailable(
  meetingId: string,
  session: Session
): Promise<void> {}

/**
 * Checks availability of multiple meetings at once
 *
 * @param meetings - Array of meetings to check
 * @param sessionId - ID of the current session
 * @param sessionDate - ISO string date of the requested session
 * @param existingSessions - Array of all sessions to check for conflicts
 * @returns Record<string, boolean> - Map of meeting IDs to availability
 */
export async function checkMeetingsAvailability(
  meetings: Meeting[],
  sessionId: string | undefined,
  sessionDate: string,
  existingSessions: Session[]
): Promise<Record<string, boolean>> {
  try {
    const meetingAvailability: Record<string, boolean> = {};

    // Initialize all meetings as available
    meetings.forEach((meeting) => {
      meetingAvailability[meeting.id] = true;
    });

    // Check each meeting for conflicts
    for (const meeting of meetings) {
      meetingAvailability[meeting.id] = await isMeetingAvailable(
        meeting.id,
        sessionId,
        sessionDate,
        existingSessions
      );
    }

    return meetingAvailability;
  } catch (error) {
    console.error("Error checking meetings availability:", error);
    return {}; // Return empty object on error
  }
}

/**
 * Adds a single new session to the database and optionally schedules a reminder email for it.
 *
 * @param session - The Session object to be added. Student ID, Tutor ID, and Date are crucial.
 * @param scheduleEmail - Optional. Boolean indicating whether to schedule a reminder email. Defaults to true.
 * @returns A promise that resolves when the operation is complete.
 * @throws Will throw an error if database insertion or email scheduling fails.
 */
export async function addOneSession(
  session: Session,
  scheduleEmail: boolean = true
): Promise<void> {
  try {
    const newSession = {
      date: session.date,
      student_id: session.student?.id,
      tutor_id: session.tutor?.id,
      status: "Active",
      summary: session.summary,
      meeting_id: session.meeting?.id,
    };

    const { data, error } = await supabase
      .from("Sessions")
      .insert(newSession)
      .select()
      .single();

    if (error) {
      throw error;
    }

    if (!data) {
      toast.error("No Data");
    }

    if (data && scheduleEmail) {
      const addedSession: Session = {
        id: data.id,
        createdAt: data.created_at,
        environment: data.environment,
        date: data.date,
        summary: data.summary,
        meeting: await getMeeting(data.meeting_id),
        student: await getProfileWithProfileId(data.student_id),
        tutor: await getProfileWithProfileId(data.tutor_id),
        status: data.status,
        session_exit_form: data.session_exit_form || null,
        isQuestionOrConcern: data.isQuestionOrConcern,
        isFirstSession: data.isFirstSession,
      };

      sendScheduledEmailsBeforeSessions([addedSession]);
      toast.success("Scheduled email");
    }
  } catch (error) {
    console.error("Unable to add one session", error);
    throw error;
  }
}

/**
 * Adds multiple sessions based on enrollments and availability within a specified week.
 * It avoids creating duplicate sessions and can optionally schedule reminder emails.
 *
 * @param weekStartString - ISO string for the start of the week.
 * @param weekEndString - ISO string for the end of the week.
 * @param enrollments - An array of Enrollment objects to generate sessions from.
 * @param sessions - An array of existing Session objects, used for duplicate checking.
 * @param scheduleEmails - Optional. Boolean indicating whether to schedule reminder emails. Defaults to true.
 * @returns A promise that resolves to an array of the newly created Session objects.
 * @throws Will throw an error if database insertion or email scheduling fails.
 */
export async function addSessions(
  weekStartString: string,
  weekEndString: string,
  enrollments: Enrollment[],
  sessions: Session[],
  scheduleEmails: boolean = true
): Promise<Session[]> {
  try {
    const weekStart = parseISO(weekStartString);
    const weekEnd = parseISO(weekEndString);
    const scheduledSessions: Set<string> = await getSessionKeys(sessions);
    // const scheduledSessions2: Set<string> = await getSessionKeys();

    // scheduledSessions2.forEach(scheduledSessions.add, scheduledSessions);

    // Prepare bulk insert data
    const sessionsToCreate: any[] = [];
    const sessionsToReturn: Session[] = [];

    // Process all enrollments
    for (const enrollment of enrollments) {
      const { student, tutor, availability, meetingId, summary } = enrollment;

      // Skip invalid enrollments
      if (!student?.id || !tutor?.id || !availability?.length) {
        console.log("Skipping invalid enrollment:", enrollment);
        continue;
      }

      // Process each availability slot
      const { day, startTime, endTime } = availability[0];

      // Skip invalid time formats
      if (
        !startTime ||
        !endTime
        // startTime.includes("-") ||
        // endTime.includes("-")
      ) {
        console.error(`Invalid time format in availability:`, availability[0]);
        continue;
      }

      // Find matching day in the week range
      let currentDate = new Date(weekStart);
      const dayLower = day.toLowerCase();

      while (currentDate <= weekEnd) {
        const currentDay = format(currentDate, "EEEE").toLowerCase();

        // Skip days that don't match
        if (currentDay !== dayLower) {
          currentDate = addDays(currentDate, 1);
          continue;
        }

        try {
          // Parse times correctly
          const [startHour, startMinute] = startTime.split(":").map(Number);
          const [endHour, endMinute] = endTime.split(":").map(Number);

          if (
            isNaN(startHour) ||
            isNaN(startMinute) ||
            isNaN(endHour) ||
            isNaN(endMinute)
          ) {
            throw new Error(
              `Invalid time format: start=${startTime}, end=${endTime}`
            );
          }

          // Create session date with correct time
          const sessionDate = new Date(currentDate);
          const sessionStartTime = setMinutes(
            setHours(sessionDate, startHour),
            startMinute
          );

          // Skip if outside the week range (redundant but safer)
          if (sessionStartTime < weekStart || sessionStartTime > weekEnd) {
            currentDate = addDays(currentDate, 1);
            continue;
          }

          // Check for duplicate session
          const sessionKey = `${student.id}-${tutor.id}-${format(
            sessionStartTime,
            "yyyy-MM-dd-HH:mm"
          )}`;

          if (!scheduledSessions.has(sessionKey)) {
            // Add to batch insert
            sessionsToCreate.push({
              date: sessionStartTime.toISOString(),
              student_id: student.id,
              tutor_id: tutor.id,
              status: "Active",
              summary: summary || "",
              meeting_id: meetingId || null,
            });

            // Track this session to avoid duplicates
            scheduledSessions.add(sessionKey);
          }
        } catch (err) {
          console.error(
            `Error processing time for ${day} ${startTime}-${endTime}:`,
            err
          );
        }

        // Move to next day
        currentDate = addDays(currentDate, 1);
      }
    }

    // Perform batch insert if we have sessions to create
    if (sessionsToCreate.length > 0) {
      const { data, error } = await supabase
        .from("Sessions")
        .insert(sessionsToCreate)
        .select();

      if (error) throw error;

      if (data) {
        // Transform returned data to Session objects
        const sessions = await Promise.all(
          data.map(async (session: any) => ({
            id: session.id,
            createdAt: session.created_at,
            environment: session.environment,
            date: session.date,
            summary: session.summary,
            meeting: await getMeeting(session.meeting_id),
            student: await getProfileWithProfileId(session.student_id),
            tutor: await getProfileWithProfileId(session.tutor_id),
            status: session.status,
            session_exit_form: session.session_exit_form || null,
            isQuestionOrConcern: session.isQuestionOrConcern,
            isFirstSession: session.isFirstSession,
          }))
        );

        if (scheduleEmails) {
          await sendScheduledEmailsBeforeSessions(sessions);
        }

        return sessions;
      }
    }

    return [];
  } catch (error) {
    console.error("Error creating sessions:", error);
    throw error;
  }
}

/**
 * Sends requests to an API endpoint to schedule reminder emails for a list of sessions.
 *
 * @param sessions - An array of Session objects for which to schedule emails.
 * @returns A promise that resolves when all scheduling requests have been attempted.
 * @throws Will throw an error if any API request fails and is not caught internally.
 */
export async function sendScheduledEmailsBeforeSessions(sessions: Session[]) {
  try {
    sessions.forEach(async (session) => {
      const response = await fetch(
        "/api/email/before-sessions/schedule-reminder",
        {
          method: "POST",
          body: JSON.stringify({ session }),
          headers: {
            "Content-Type": "applications/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to schedule emails");
      }
    });

    toast.success("Session Emails Scheduled");
  } catch (error) {
    console.error("Error scheduling session emails", error);
    throw error;
  }
}

/**
 * Sends a request to an API endpoint to delete a scheduled reminder email for a specific session.
 *
 * @param sessionId - The ID of the session whose scheduled email is to be deleted.
 * @returns A promise that resolves when the deletion request has been attempted.
 * @throws Will throw an error if the API request fails.
 */
export async function deleteScheduledEmailBeforeSessions(sessionId: string) {
  try {
    const response = await fetch("/api/email/before-sessions/delete-reminder", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
      headers: {
        "Content-Type": "applications/json",
      },
    });

    if (!response.ok) {
      throw new Error("Unable to delete scheduled email");
    }

    toast.success("Deleted Scheduled Email");
  } catch (error) {
    console.error("Unable to delete message");
    throw error;
  }
}

/**
 * Updates a scheduled reminder email for a session by deleting the old one and scheduling a new one.
 *
 * @param session - The Session object with updated details.
 * @returns A promise that resolves when the update process is complete.
 * @throws Will throw an error if deletion or scheduling fails.
 */
export async function updateScheduledEmailBeforeSessions(session: Session) {
  try {
    await deleteScheduledEmailBeforeSessions(session.id);
    await sendScheduledEmailsBeforeSessions([session]);
    toast.success("Successfully updated scheduled reminder");
  } catch (error) {
    console.error("Unable to update scheduled message");
    throw error;
  }
}

/**
 * Updates an existing session's details in the database.
 * Optionally, it can also update the associated scheduled reminder email.
 *
 * @param updatedSession - The Session object containing the new data. Must include an ID.
 * @param updateEmail - Optional. Boolean indicating whether to update the scheduled email. Defaults to true.
 * @returns A promise that resolves to the updated session data from Supabase, or null if an error occurs or no data is returned.
 */
export async function updateSession(
  updatedSession: Session,
  updateEmail: boolean = true
) {
  try {
    const {
      id,
      status,
      tutor,
      student,
      date,
      summary,
      meeting,
      session_exit_form,
      isQuestionOrConcern,
      isFirstSession,
    } = updatedSession;

    console.log(id);
    console.log(status);
    console.log(isQuestionOrConcern);
    console.log(isFirstSession);
    console.log(meeting);

    const { data, error } = await supabase
      .from("Sessions")
      .update({
        status: status,
        student_id: student?.id,
        tutor_id: tutor?.id,
        date: date,
        summary: summary,
        meeting_id: meeting?.id,
        session_exit_form: session_exit_form,
        is_question_or_concern: isQuestionOrConcern,
        is_first_session: isFirstSession,
      })
      .eq("id", id)
      .select()
      .single();
    console.log("UPDATING...");

    if (error) {
      console.error("Error updating session:", error);
      return null;
    }

    if (data) {
      console.log(data);
      return data;
    } else {
      console.error("NO DATA");
    }

    if (updateEmail && data) {
      const newSession: Session = {
        id: data.id,
        createdAt: data.created_at,
        environment: data.environment,
        date: data.date,
        summary: data.summary,
        meeting: await getMeeting(data.meeting_id),
        student: await getProfileWithProfileId(data.student_id),
        tutor: await getProfileWithProfileId(data.tutor_id),
        status: data.status,
        session_exit_form: data.session_exit_form || null,
        isQuestionOrConcern: data.isQuestionOrConcern,
        isFirstSession: data.isFirstSession,
      };

      await updateScheduledEmailBeforeSessions(newSession);
    }
  } catch (error) {
    console.error("Unable to update session");
  }
}

/**
 * Deletes a session from the database.
 * Optionally, it can also delete any associated scheduled reminder email.
 *
 * @param sessionId - The ID of the session to remove.
 * @param updateEmail - Optional. Boolean indicating whether to delete the scheduled email. Defaults to true.
 * @returns A promise that resolves when the operation is complete.
 * @throws Will throw an error if the database deletion or email deletion fails.
 */
export async function removeSession(
  sessionId: string,
  updateEmail: boolean = true
) {
  try {
    const { error: eventError } = await supabase
      .from("Sessions")
      .delete()
      .eq("id", sessionId);

    console.log(sessionId);

    if (eventError) {
      throw eventError;
    }

    if (updateEmail) {
      await deleteScheduledEmailBeforeSessions(sessionId);
    }
  } catch (error) {
    // Create a notification for the admin
    throw error;
  }
}

/**
 * Fetches all meeting records from the database.
 *
 * @returns A promise that resolves to an array of Meeting objects, or null if an error occurs or no meetings are found.
 */
export async function getMeetings(): Promise<Meeting[] | null> {
  try {
    // Fetch meeting details from Supabase
    const { data, error } = await supabase.from("Meetings").select(`
        id,
        link,
        meeting_id,
        password,
        created_at,
        name
      `);

    // Check for errors and log them
    if (error) {
      console.error("Error fetching event details:", error.message);
      return null; // Returning null here is valid since the function returns Promise<Notification[] | null>
    }

    // Check if data exists
    if (!data) {
      console.log("No events found:");
      return null; // Valid return
    }

    // Mapping the fetched data to the Notification object
    const meetings: Meeting[] = await Promise.all(
      data.map(async (meeting: any) => ({
        id: meeting.id,
        name: meeting.name,
        meetingId: meeting.meeting_id,
        password: meeting.password,
        link: meeting.link,
        createdAt: meeting.created_at,
        // name: meeting.name,
      }))
    );

    return meetings; // Return the array of notifications
  } catch (error) {
    console.error("Unexpected error in getMeeting:", error);
    return null; // Valid return
  }
}

/**
 * Creates an Enrollment object from various input data and then adds it to the database.
 * This seems to be a helper for migrating or transforming data before enrollment.
 *
 * @param entry - An object containing summary, startDate, endDate, availability, and meetingId.
 * @param studentData - Data representing the student for the enrollment.
 * @param tutorData - Data representing the tutor for the enrollment.
 * @returns A promise that resolves to the result of the `addEnrollment` function call (likely the created Enrollment).
 */
export const createEnrollment = async (
  entry: any,
  studentData: any,
  tutorData: any
) => {
  const migratedPairing: Enrollment = {
    id: "",
    createdAt: "",
    student: studentData,
    tutor: tutorData,
    summary: entry.summary,
    startDate: entry.startDate,
    endDate: entry.endDate,
    availability: entry.availability,
    meetingId: entry.meetingId,
  };

  return await addEnrollment(migratedPairing);
};

/**
 * Fetches all enrollment records from the database, populating student and tutor details.
 *
 * @returns A promise that resolves to an array of Enrollment objects, or null if an error occurs or no enrollments are found.
 */
export async function getAllEnrollments(): Promise<Enrollment[] | null> {
  try {
    // Fetch meeting details from Supabase
    const { data, error } = await supabase.from("Enrollments").select(`
        id,
        created_at,
        summary,
        student_id,
        tutor_id,
        start_date,
        end_date,
        availability,
        meetingId
      `);

    // Check for errors and log them
    if (error) {
      console.error("Error fetching event details:", error.message);
      return null; // Returning null here is valid since the function returns Promise<Notification[] | null>
    }

    // Check if data exists
    if (!data) {
      console.log("No events found:");
      return null; // Valid return
    }

    // Mapping the fetched data to the Notification object
    const enrollments: Enrollment[] = await Promise.all(
      data.map(async (enrollment: any) => ({
        createdAt: enrollment.created_at,
        id: enrollment.id,
        summary: enrollment.summary,
        student: await getProfileWithProfileId(enrollment.student_id),
        tutor: await getProfileWithProfileId(enrollment.tutor_id),
        startDate: enrollment.start_date,
        endDate: enrollment.end_date,
        availability: enrollment.availability,
        meetingId: enrollment.meetingId,
      }))
    );

    return enrollments; // Return the array of enrollments
  } catch (error) {
    console.error("Unexpected error in getMeeting:", error);
    return null;
  }
}

/**
 * Fetches a single meeting record from the database by its ID.
 *
 * @param id - The ID of the meeting to fetch.
 * @returns A promise that resolves to a Meeting object, or null if not found or an error occurs.
 */
export async function getMeeting(id: string): Promise<Meeting | null> {
  try {
    // Fetch meeting details from Supabase
    const { data, error } = await supabase
      .from("Meetings")
      .select(
        `
        id,
        link,
        meeting_id,
        password,
        created_at,
        name
      `
      )
      .eq("id", id)
      .single();

    // Check for errors and log them
    if (error) {
      console.error("Error fetching event details:", error.message);
      return null; // Returning null here is valid since the function returns Promise<Notification[] | null>
    }
    // Check if data exists
    if (!data) {
      console.log("No events found:");
      return null; // Valid return
    }
    // Mapping the fetched data to the Notification object
    const meeting: Meeting = {
      id: data.id,
      name: data.name,
      meetingId: data.meeting_id,
      password: data.password,
      link: data.link,
      createdAt: data.created_at,
    };
    console.log(meeting);
    return meeting; // Return the array of notifications
  } catch (error) {
    console.error("Unexpected error in getMeeting:", error);
    return null; // Valid return
  }
}

/**
 * Updates an existing enrollment record in the database.
 *
 * @param enrollment - The Enrollment object containing the updated data. Must include an ID.
 * @returns A promise that resolves to the updated enrollment data from Supabase.
 * @throws Will throw an error if the update operation fails.
 */
export const updateEnrollment = async (enrollment: Enrollment) => {
  const { data, error } = await supabase
    .from("Enrollments")
    .update({
      student_id: enrollment.student?.id,
      tutor_id: enrollment.tutor?.id,
      summary: enrollment.summary,
      start_date: enrollment.startDate,
      end_date: enrollment.endDate,
      availability: enrollment.availability,
      meetingId: enrollment.meetingId,
    })
    .eq("id", enrollment.id)
    .select("*") // Ensure it selects all columns
    .single(); // Ensure only one object is returned

  if (error) {
    console.error("Error updating enrollment:", error);
    throw error;
  }

  return data;
};

/**
 * Validates if a given string is a valid UUID (version 4).
 *
 * @param uuid - The string to validate.
 * @returns True if the string is a valid UUID, false otherwise.
 */
const isValidUUID = (uuid: string): boolean => {
  const uuidRegex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return uuidRegex.test(uuid);
};

/**
 * Adds a new enrollment record to the database.
 *
 * @param enrollment - The enrollment data to add, excluding 'id' and 'createdAt' which are auto-generated.
 *                     Requires student, and validates meetingId if provided.
 * @returns A promise that resolves to the newly created and fully populated Enrollment object.
 * @throws Will throw an error if student is missing, meetingId is invalid, or database insertion fails.
 */
export const addEnrollment = async (
  enrollment: Omit<Enrollment, "id" | "createdAt">
) => {
  console.log(enrollment);
  if (!enrollment.student) throw new Error("Please select a Student");

  if (enrollment.meetingId && !isValidUUID(enrollment.meetingId)) {
    throw new Error("Invalid or no meeting link");
  }

  const { data, error } = await supabase
    .from("Enrollments")
    .insert({
      student_id: enrollment.student?.id,
      tutor_id: enrollment.tutor?.id,
      summary: enrollment.summary,
      start_date: enrollment.startDate,
      end_date: enrollment.endDate,
      availability: enrollment.availability,
      meetingId: enrollment.meetingId,
    })
    .select(`*`)
    .single();

  if (error) {
    console.error("Error adding enrollment:", error);
    throw error;
  }

  console.log(data);

  return {
    createdAt: data.created_at,
    id: data.id,
    summary: data.summary,
    student: await getProfileWithProfileId(data.student_id),
    tutor: await getProfileWithProfileId(data.tutor_id),
    startDate: data.start_date,
    endDate: data.end_date,
    availability: data.availability,
    meetingId: data.meetingId,
  };
};

/**
 * Deletes an enrollment record from the database by its ID.
 *
 * @param enrollmentId - The ID of the enrollment to remove.
 * @returns A promise that resolves to the data returned by the Supabase delete operation (often null or an empty array on success).
 * @throws Will throw an error if the deletion fails.
 */
export const removeEnrollment = async (enrollmentId: string) => {
  const { data, error } = await supabase
    .from("Enrollments")
    .delete()
    .eq("id", enrollmentId);

  if (error) {
    console.error("Error removing enrollment:", error);
    throw error;
  }

  return data;
};

/**
 * Fetches all events associated with a specific tutor ID.
 *
 * @param tutorId - The ID of the tutor whose events are to be fetched.
 * @returns A promise that resolves to an array of Event objects. Returns an empty array on error or if no events are found.
 */
export async function getEvents(tutorId: string): Promise<Event[]> {
  try {
    // Fetch meeting details from Supabase
    const { data, error } = await supabase
      .from("Events")
      .select(
        `
        id,
        created_at,
        date,
        summary,
        tutor_id,
        hours
      `
      )
      .eq("tutor_id", tutorId);

    // Check for errors and log them
    if (error) {
      console.error("Error fetching event details:", error.message);
      return []; // Returning null here is valid since the function returns Promise<Notification[] | null>
    }

    // Check if data exists
    if (!data) {
      console.log("No events found:");
      return []; // Valid return
    }

    // Mapping the fetched data to the Notification object
    const events: Event[] = await Promise.all(
      data.map(async (event: any) => ({
        createdAt: event.created_at,
        id: event.id,
        summary: event.summary,
        tutorId: event.tutor_id,
        date: event.date,
        hours: event.hours,
      }))
    );

    return events; // Return the array of notifications
  } catch (error) {
    console.error("Unexpected error in getMeeting:", error);
    return [];
  }
}

/**
 * Fetches events for a specific tutor that fall within a selected month.
 *
 * @param tutorId - The ID of the tutor.
 * @param selectedMonth - An ISO string representing any date within the desired month (e.g., "YYYY-MM-01").
 *                        The function calculates the start and end of this month for filtering.
 * @returns A promise that resolves to an array of Event objects, or null if an error occurs or no events are found.
 */
export async function getEventsWithTutorMonth(
  tutorId: string,
  selectedMonth: string
): Promise<Event[] | null> {
  try {
    // Fetch event details filtered by tutor IDs and selected month
    const { data, error } = await supabase
      .from("Events")
      .select(
        `
        id,
        created_at,
        date,
        summary,
        tutor_id,
        hours
      `
      )
      .eq("tutor_id", tutorId) // Filter by tutor IDs
      .gte("date", selectedMonth) // Filter events from the start of the selected month
      .lt(
        "date",
        new Date(
          new Date(selectedMonth).setMonth(
            new Date(selectedMonth).getMonth() + 1
          )
        ).toISOString()
      ); // Filter before the start of the next month

    // Check for errors and log them
    if (error) {
      console.error("Error fetching event details:", error.message);
      return null;
    }

    // Check if data exists
    if (!data) {
      console.log("No events found:");
      return null;
    }

    // Map the fetched data to the Event object
    const events: Event[] = data.map((event: any) => ({
      createdAt: event.created_at,
      id: event.id,
      summary: event.summary,
      tutorId: event.tutor_id,
      date: event.date,
      hours: event.hours,
    }));

    return events; // Return the array of events
  } catch (error) {
    console.error("Unexpected error in getEventsWithTutorMonth:", error);
    return null;
  }
}

/**
 * Creates a new event record in the database.
 *
 * @param event - The Event object containing data for the new event.
 * @returns A promise that resolves when the event creation is attempted.
 * @throws Will throw an error if the database insertion fails.
 */
export async function createEvent(event: Event) {
  // Create a notification for the admin
  const { error: eventError } = await supabase.from("Events").insert({
    date: event.date,
    summary: event.summary,
    tutor_id: event.tutorId,
    hours: event.hours,
  });

  if (eventError) {
    throw eventError;
  }
}

/**
 * Deletes an event record from the database by its ID.
 *
 * @param eventId - The ID of the event to remove.
 * @returns A promise that resolves to true if deletion was successful (at least one row affected), false otherwise.
 * @throws Will throw an error if the database operation itself fails.
 */
export async function removeEvent(eventId: string): Promise<boolean> {
  try {
    // Validate eventId format
    if (!eventId || typeof eventId !== "string") {
      console.error("Invalid event ID provided:", eventId);
      return false;
    }

    // Attempt to delete the event
    const { data, error, count } = await supabase
      .from("Events")
      .delete()
      .eq("id", eventId)
      .select(); // Add this to get back the deleted record

    if (error) {
      console.error("Error deleting event:", error);
      throw error;
    }

    // Check if any records were actually deleted
    if (!data || data.length === 0) {
      console.warn(`No event found with ID: ${eventId}`);
      return false;
    }

    console.log(`Successfully deleted event with ID: ${eventId}`);
    return true;
  } catch (error) {
    console.error("Failed to remove event:", error);
    throw error;
  }
}

/* NOTIFICATIONS */

/**
 * Fetches all notification records from the database, populating student and tutor details.
 *
 * @returns A promise that resolves to an array of Notification objects, or null if an error occurs or no notifications are found.
 */
export async function getAllNotifications(): Promise<Notification[] | null> {
  try {
    // Fetch meeting details from Supabase
    const { data, error } = await supabase.from("Notifications").select(`
        id,
        created_at,
        session_id,
        previous_date,
        suggested_date,
        tutor_id,
        student_id,
        status,
        summary
      `);

    // Check for errors and log them
    if (error) {
      console.error("Error fetching notification details:", error.message);
      return null; // Returning null here is valid since the function returns Promise<Notification[] | null>
    }

    // Check if data exists
    if (!data) {
      console.log("No notifications found:");
      return null; // Valid return
    }

    // Mapping the fetched data to the Notification object
    const notifications: Notification[] = await Promise.all(
      data.map(async (notification: any) => ({
        createdAt: notification.created_at,
        id: notification.id,
        summary: notification.summary,
        sessionId: notification.session_id,
        previousDate: notification.previous_date,
        suggestedDate: notification.suggested_date,
        student: await getProfileWithProfileId(notification.student_id),
        tutor: await getProfileWithProfileId(notification.tutor_id),
        status: notification.status,
      }))
    );

    return notifications; // Return the array of notifications
  } catch (error) {
    console.error("Unexpected error in getMeeting:", error);
    return null; // Valid return
  }
}

/**
 * Updates the status of a specific notification.
 *
 * @param notificationId - The ID of the notification to update.
 * @param status - The new status for the notification ("Active" or "Resolved").
 * @returns A promise that resolves to the data returned by the supabase update operation.
 * @throws Will throw an error if the update fails
 */
export const updateNotification = async (
  notificationId: string,
  status: "Active" | "Resolved"
) => {
  try {
    const { data, error } = await supabase
      .from("Notifications") // Adjust this table name to match your database
      .update({ status: status }) // Update the status field
      .eq("id", notificationId); // Assuming `id` is the primary key for the notifications table

    if (error) {
      throw error; // Handle the error as needed
    }

    return data; // Return the updated notification data or whatever is needed
  } catch (error) {
    console.error("Error updating notification:", error);
    throw new Error("Failed to update notification");
  }
};

/**
 * Generates a random 10-digit password string.
 *
 * @returns A promise that resolves to a string representing the 10-digit password
 */
export async function createPassword(): Promise<string> {
  let password = "";

  for (let i = 0; i < 10; ++i) {
    password += Math.floor(Math.random() * 10);
  }

  return password;
}
