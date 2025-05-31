// lib/student.actions.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Profile, Session } from "@/types";
import { getProfileWithProfileId } from "./user.actions";
import { getMeeting } from "./meeting.actions";

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/**
 * Fetches sessions for a given student.
 * @param {string} profileId - The ID of the student's profile.
 * @param {string} [startDate] - Optional start date to filter sessions.
 * @param {string} [endDate] - Optional end date to filter sessions.
 * @param {string | string[]} [status] - Optional status or array of statuses to filter sessions.
 * @param {string} [orderby] - Optional field to order the sessions by.
 * @param {boolean} [ascending] - Optional boolean to determine if the order is ascending.
 * @returns {Promise<Session[]>} A promise that resolves to an array of session objects.
 * @throws Will throw an error if fetching sessions fails.
 */
export async function getStudentSessions(
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
    .eq("student_id", profileId);

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
      status: session.status,
      student: await getProfileWithProfileId(session.student_id),
      tutor: await getProfileWithProfileId(session.tutor_id),
      session_exit_form: session.session_exit_form,
      isQuestionOrConcern: session.isQuestionOrConcern,
      isFirstSession: session.isFirstSession,
    }))
  );

  return sessions;
}

/**
 * Creates a reschedule request notification for a session.
 * @param {string} sessionId - The ID of the session to reschedule.
 * @param {string} newDate - The proposed new date for the session.
 * @param {string} studentId - The ID of the student requesting the reschedule.
 * @returns {Promise<void>} A promise that resolves when the notification is created.
 * @throws Will throw an error if creating the reschedule request fails.
 */
export async function rescheduleSession(
  sessionId: string,
  newDate: string,
  studentId: string
): Promise<void> {
  try {
    // First, get the current session details
    const { data: sessionData, error: sessionError } = await supabase
      .from("Sessions")
      .select("*")
      .eq("id", sessionId)
      .single();

    if (sessionError) {
      throw sessionError;
    }

    if (sessionData) {
      return sessionData[0];
    }

    // Create a notification for the admin
    const { error: notificationError } = await supabase
      .from("Notifications")
      .insert({
        session_id: sessionId,
        previous_date: sessionData.date,
        suggested_date: newDate,
        student_id: studentId,
        tutor_id: sessionData.tutor_id,
        type: "RESCHEDULE_REQUEST",
        status: "PENDING",
      });

    if (notificationError) {
      throw notificationError;
    }

    console.log("Reschedule request notification created successfully");
  } catch (error) {
    console.error("Error creating reschedule request:", error);
    throw error;
  }
}

/**
 * Enrolls a student in an available session.
 * @param {string} studentId - The ID of the student to enroll.
 * @param {string} sessionId - The ID of the session to enroll in.
 * @returns {Promise<any>} A promise that resolves with the updated session data.
 * @throws Will throw an error if enrolling in the session fails.
 */
export async function enrollInSession(studentId: string, sessionId: string) {
  try {
    const { data, error } = await supabase
      .from("Sessions")
      .update({ student_id: studentId })
      .eq("id", sessionId)
      .is("student_id", null) // Ensure the session is not already taken
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error enrolling in session:", error);
    throw error;
  }
}

/**
 * Cancels a student's enrollment in a session.
 * @param {string} sessionId - The ID of the session to cancel enrollment from.
 * @returns {Promise<any>} A promise that resolves with the updated session data.
 * @throws Will throw an error if cancelling the enrollment fails.
 */
export async function cancelEnrollment(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from("Sessions")
      .update({ student_id: null })
      .eq("id", sessionId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error cancelling enrollment:", error);
    throw error;
  }
}

/**
 * Fetches the assigned tutor for a given student.
 * @param {string} studentId - The ID of the student.
 * @returns {Promise<any>} A promise that resolves with the student-tutor assignment data, including tutor details.
 * @throws Will throw an error if fetching the student's tutor fails.
 */
export async function getStudentTutor(studentId: string) {
  try {
    const { data, error } = await supabase
      .from("student_tutor_assignments")
      .select(
        `
        *,
        tutors (*)
      `
      )
      .eq("student_id", studentId)
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching student tutor:", error);
    throw error;
  }
}

/**
 * Submits feedback for a session.
 * @param {string} sessionId - The ID of the session for which feedback is being submitted.
 * @param {string} feedback - The feedback text.
 * @param {number} rating - The rating given for the session.
 * @returns {Promise<any>} A promise that resolves with the created feedback data.
 * @throws Will throw an error if submitting feedback fails.
 */
export async function submitFeedback(
  sessionId: string,
  feedback: string,
  rating: number
) {
  try {
    const { data, error } = await supabase
      .from("session_feedback")
      .insert({
        session_id: sessionId,
        feedback: feedback,
        rating: rating,
      })
      .single();

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error submitting feedback:", error);
    throw error;
  }
}

/**
 * Fetches the progress records for a given student.
 * @param {string} studentId - The ID of the student.
 * @returns {Promise<any[]>} A promise that resolves to an array of student progress records.
 * @throws Will throw an error if fetching student progress fails.
 */
export async function getStudentProgress(studentId: string) {
  try {
    const { data, error } = await supabase
      .from("student_progress")
      .select("*")
      .eq("student_id", studentId)
      .order("date", { ascending: false });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching student progress:", error);
    throw error;
  }
}
