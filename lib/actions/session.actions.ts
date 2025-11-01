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
import {
  deleteScheduledEmailBeforeSessions,
  sendScheduledEmailsBeforeSessions,
  updateScheduledEmailBeforeSessions,
} from "./email.server.actions";
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
import { date } from "zod";
import { withCoalescedInvoke } from "next/dist/lib/coalesced-function";
import toast from "react-hot-toast";
import { DatabaseIcon } from "lucide-react";
import { SYSTEM_ENTRYPOINTS } from "next/dist/shared/lib/constants";
import { getAllSessions } from "./admin.actions";
import { fromZonedTime } from "date-fns-tz";
import { getSessionKeys } from "./session.server.actions";
import { Table } from "../supabase/tables";
// import { getMeeting } from "./meeting.actions";

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/**
 * Fetches all sessions within a 24-hour window around the requested date
 * @param requestedDate - The date to search around for existing sessions
 * @returns Promise resolving to array of sessions or undefined
 */
export const fetchDaySessionsFromSchedule = async (requestedDate: Date) => {
  if (requestedDate) {
    try {
      const startDateSearch = addHours(requestedDate, -12).toISOString();

      const endDateSearch = addHours(requestedDate, 12).toISOString();
      const data = await getAllSessions(startDateSearch, endDateSearch);
      return data;
    } catch (error) {
      console.error("Failed to fetch sessions for day");
      throw error;
    }
  }
};



/**
 * Add sessions for enrollments within the specified week range
 * @param weekStartString - ISO string of week start in Eastern Time
 * @param weekEndString - ISO string of week end in Eastern Time
 * @param enrollments - List of enrollments to create sessions for
 * @param sessions - Existing sessions to avoid duplicates
 * @returns Newly created sessions
 */
export async function addSessions(
  weekStartString: string,
  weekEndString: string,
  enrollments: Enrollment[],
  sessions: Session[]
) {


  try {
    const weekStart: Date = fromZonedTime(
      parseISO(weekStartString),
      "America/New_York"
    );
    const weekEnd: Date = fromZonedTime(
      parseISO(weekEndString),
      "America/New_York"
    );

    const now: string = new Date().toISOString();

    //Set created to avoid duplicates
    const scheduledSessions: Set<string> = await getSessionKeys(sessions);
    // Prepare bulk insert data
    const sessionsToCreate: any[] = [];

    // Process all enrollments
    for (const enrollment of enrollments) {
      const {
        id,
        student,
        tutor,
        availability,
        meetingId,
        summary,
        startDate,
        duration,
        frequency,
      } = enrollment;

      // if (frequency === "biweekly") {
      //   if (await isSessioninPastWeek(id, addDays(weekStart, 3))) continue;
      // }

      const startDate_asDate = new Date(startDate); //UTC

      //Check if paused over the summer
      if (enrollment.paused) {
        continue;
      }

      // Skip invalid enrollments
      if (!student?.id || !tutor?.id || !availability?.length) {
        continue;
      }

      // Process each availability slot
      let { day, startTime, endTime } = availability[0];

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

        //Add Seven Days if CurrentDate is last week (Acts as a Modulus to ensure updating current week only)
        if (currentDate < parseISO(weekStartString)) {
          currentDate = addDays(currentDate, 7);
        }

        //Remove Seven Days if CurrentDate is next week (Acts as a Modulus to ensure updating current week only)
        if (currentDate > parseISO(weekEndString)) {
          currentDate = addDays(currentDate, -7);
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
          // * SetHours and SetMinutes are dependent on local timezone

          const dateString = `${format(currentDate, "yyyy-MM-dd")}T${startTime}:00`;
          const sessionStartTime = fromZonedTime(
            dateString,
            "America/New_York"
          ); // Automatically handles DST

          if (sessionStartTime < startDate_asDate) {
            throw new Error("Session occurs before start date");
          }

          // Check for duplicate session
          const sessionKey = `${student.id}-${tutor.id}-${format(
            sessionStartTime,
            "yyyy-MM-dd-HH:mm"
          )}`;

          if (!scheduledSessions.has(sessionKey)) {
            // Add to batch insert
            sessionsToCreate.push({
              enrollment_id: id,
              date: sessionStartTime.toISOString(),
              student_id: student.id,
              tutor_id: tutor.id,
              status: "Active",
              summary: summary || "",
              meeting_id: meetingId || null,
              duration: duration,
            });

            // Track this session to avoid duplicates
            scheduledSessions.add(sessionKey);
          } ////
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
        .from(Table.Sessions)
        .insert(sessionsToCreate)
        .select(`
          *,
          student:Profiles!student_id(*),
          tutor:Profiles!tutor_id(*),
          meeting:Meetings!meeting_id(*)
          `);

      if (error) throw error;

      if (data) {
        // Transform returned data to Session objects
        const sessions: Session[] = await Promise.all(
          data.map(async (session: any) => ({
            id: session.id,
            enrollmentId: session.enrollment_id,
            createdAt: session.created_at,
            environment: session.environment,
            date: session.date,
            summary: session.summary,
            meeting: session.meeting,
            student: session.student,
            tutor: session.tutor,
            status: session.status,
            session_exit_form: session.session_exit_form || null,
            isQuestionOrConcern: session.isQuestionOrConcern,
            isFirstSession: session.isFirstSession,
            duration: session.duration,
          }))
        );

        // // if (!sessions) return;

        // scheduleMultipleSessionReminders(sessions!);

        // //Schedule emails
        return sessions;
      }
    }

    return [];
  } catch (error) {
    console.error("Error creating sessions:", error);
    throw error;
  }
}
