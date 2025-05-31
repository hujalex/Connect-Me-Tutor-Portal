// lib/tutors.actions.ts

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Profile, Session } from "@/types";
import { getProfileWithProfileId } from "./user.actions";
import { getMeeting } from "./meeting.actions";

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/**
 * Fetches sessions for a given tutor.
 * @param {string} profileId - The ID of the tutor's profile.
 * @param {string} [startDate] - Optional start date to filter sessions.
 * @param {string} [endDate] - Optional end date to filter sessions.
 * @param {string | string[]} [status] - Optional status or array of statuses to filter sessions.
 * @param {string} [orderby] - Optional field to order the sessions by.
 * @param {boolean} [ascending] - Optional boolean to determine if the order is ascending.
 * @returns {Promise<Session[]>} A promise that resolves to an array of session objects.
 * @throws Will throw an error if fetching sessions fails.
 */
export async function getTutorSessions(
  profileId: string,
  startDate?: string,
  endDate?: string,
  status?: string | string[],
  orderby?: string,
  ascending?: boolean
): Promise<Session[]> {
  let query = supabase
    .from("Sessions")
    .select(
      `
     *
    `
    )
    .eq("tutor_id", profileId);

  if (startDate) {
    query = query.gte("date", startDate);
  }
  if (endDate) {
    query = query.lte("date", endDate);
  }

  if (status) {
    if (Array.isArray(status)) {
      query = query.in("status", status);
    } else {
      query = query.eq("status", status);
    }
  }

  if (orderby && ascending !== undefined) {
    query = query.order(orderby, { ascending });
  }

  const { data, error } = await query;

  if (error) {
    console.error("Error fetching student sessions:", error.message);
    throw error;
  }

  const sessions: Session[] = await Promise.all(
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
      session_exit_form: session.session_exit_form,
      isQuestionOrConcern: Boolean(session.isQuestionOrConcernO),
      isFirstSession: Boolean(session.isFirstSession),
    }))
  );

  console.log("Tutor's sessions", sessions);

  return sessions;
}

/**
 * Fetches all students assigned to a specific tutor.
 * @param {string} tutorId - The ID of the tutor.
 * @returns {Promise<Profile[] | null>} A promise that resolves to an array of student profiles or null if an error occurs.
 */
export async function getTutorStudents(tutorId: string) {
  try {
    const { data: enrollments, error: enrollmentError } = await supabase
      .from("Enrollments")
      .select("student_id")
      .eq("tutor_id", tutorId);

    if (enrollmentError) {
      console.error("Error fetching enrollments:", enrollmentError);
      return null;
    }

    if (!enrollments) {
      console.log("No profile found for tutor ID:", tutorId);
      return null;
    }

    const studentIds = enrollments.map((enrollment) => enrollment.student_id);

    const { data: studentProfiles, error: profileError } = await supabase
      .from("Profiles")
      .select("*")
      .in("id", studentIds);

    if (profileError) {
      console.error("Error fetching student profile", profileError);
      return null;
    }

    // Mapping the fetched data to the Profile object
    const userProfiles: Profile[] = studentProfiles.map((profile: any) => ({
      id: profile.id,
      createdAt: profile.created_at,
      role: profile.role,
      userId: profile.user_id,
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

    console.log("Mapped profile data:", userProfiles);
    return userProfiles;
  } catch (error) {
    console.error("Unexpected error in getProfile:", error);
    return null;
  }
}

/**
 * Reschedules a session and creates a notification.
 * @param {string} sessionId - The ID of the session to reschedule.
 * @param {any} newDate - The new date for the session.
 * @param {string} [tutorid] - The ID of the tutor (optional, but good practice to include if available).
 * @returns {Promise<any>} A promise that resolves with the updated session data.
 * @throws Will throw an error if rescheduling fails or notification creation fails.
 */
export async function rescheduleSession(
  sessionId: string,
  newDate: any,
  tutorid?: string
) {
  try {
    console.log(sessionId);
    console.log(newDate);
    const { data: sessionData, error } = await supabase
      .from("Sessions")
      .update({ date: newDate })
      .eq("id", sessionId)
      .select("*")
      .single();

    if (error) throw error;

    const { error: notificationError } = await supabase
      .from("Notifications")
      .insert({
        session_id: sessionId,
        previous_date: sessionData.date,
        suggested_date: newDate,
        tutor_id: sessionData.tutor_id,
        student_id: sessionData.student_id,
        type: "RESCHEDULE_REQUEST",
        status: "Active",
      });

    if (notificationError) throw notificationError;
    if (sessionData) {
      return sessionData[0];
    }
  } catch (error) {
    console.error("Unable to reschedule", error);
    throw error;
  }
}

/**
 * Cancels a session by updating its status to "CANCELLED".
 * @param {string} sessionId - The ID of the session to cancel.
 * @returns {Promise<any>} A promise that resolves with the updated session data.
 * @throws Will throw an error if updating the session fails.
 */
export async function cancelSession(sessionId: string) {
  const { data, error } = await supabase
    .from("Sessions")
    .update({ status: "CANCELLED" })
    .eq("id", sessionId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Adds notes to a specific session.
 * @param {string} sessionId - The ID of the session to add notes to.
 * @param {string} notes - The notes to add.
 * @returns {Promise<any>} A promise that resolves with the updated session data.
 * @throws Will throw an error if updating the session fails.
 */
export async function addSessionNotes(sessionId: string, notes: string) {
  const { data, error } = await supabase
    .from("Sessions")
    .update({ notes: notes })
    .eq("id", sessionId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Fetches the availability for a given tutor.
 * @param {string} tutorId - The ID of the tutor.
 * @returns {Promise<any[]>} A promise that resolves to an array of availability objects.
 * @throws Will throw an error if fetching availability fails.
 */
export async function getTutorAvailability(tutorId: string) {
  const { data, error } = await supabase
    .from("tutor_availability")
    .select("*")
    .eq("tutor_id", tutorId);

  if (error) throw error;
  return data;
}

/**
 * Updates or inserts the availability for a given tutor.
 * @param {string} tutorId - The ID of the tutor.
 * @param {any} availabilityData - The availability data to update or insert.
 * @returns {Promise<any>} A promise that resolves with the updated or inserted availability data.
 * @throws Will throw an error if the upsert operation fails.
 */
export async function updateTutorAvailability(
  tutorId: string,
  availabilityData: any
) {
  const { data, error } = await supabase
    .from("tutor_availability")
    .upsert({ tutor_id: tutorId, ...availabilityData })
    .eq("tutor_id", tutorId);

  if (error) throw error;
  return data;
}

/**
 * Fetches all tutor resources.
 * @returns {Promise<any[]>} A promise that resolves to an array of tutor resource objects.
 * @throws Will throw an error if fetching resources fails.
 */
export async function getTutorResources() {
  const { data, error } = await supabase.from("tutor_resources").select("*");

  if (error) throw error;
  return data;
}

/**
 * Logs the attendance status for a session.
 * @param {string} sessionId - The ID of the session.
 * @param {boolean} attended - Boolean indicating whether the session was attended.
 * @returns {Promise<any>} A promise that resolves with the updated session data.
 * @throws Will throw an error if updating the session fails.
 */
export async function logSessionAttendance(
  sessionId: string,
  attended: boolean
) {
  const { data, error } = await supabase
    .from("Sessions")
    .update({ attended: attended })
    .eq("id", sessionId)
    .single();

  if (error) throw error;
  return data;
}

/**
 * Records notes from a session exit form.
 * @param {string} sessionId - The ID of the session.
 * @param {string} notes - The notes from the exit form.
 * @returns {Promise<void>} A promise that resolves when the notes are recorded.
 * @throws Will throw an error if updating the session fails.
 */
export async function recordSessionExitForm(sessionId: string, notes: string) {
  const { data, error } = await supabase
    .from("Sessions")
    .update({ session_exit_form: notes })
    .eq("id", sessionId)
    .single();
  if (error) throw error;
}
