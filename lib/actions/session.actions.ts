import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Session, Enrollment } from "@/types";
import { getProfileWithProfileId } from "./user.actions";
import {
  sendScheduledEmailsBeforeSessions,
  updateScheduledEmailBeforeSessions,
  deleteScheduledEmailBeforeSessions,
} from "./email.actions";
import { getMeeting } from "./meeting.actions";
import { addDays, format, parseISO, setHours, setMinutes } from "date-fns"; // Only use date-fns
import toast from "react-hot-toast";
// import { getMeeting } from "./meeting.actions";

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

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
