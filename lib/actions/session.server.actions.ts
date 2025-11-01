"use server";
import { supabase } from "../supabase/server";
import { Enrollment, Session } from "@/types";
import { toast } from "react-hot-toast";
import { Client } from "@upstash/qstash";
import { createClient } from "@supabase/supabase-js";
import { Profile } from "@/types";
import { getProfileWithProfileId } from "./user.actions";
import { getMeeting } from "./meeting.server.actions";
import { createServerClient } from "../supabase/server";
import { Table } from "../supabase/tables";

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
  startOfWeek,
  endOfWeek,
  subDays,
} from "date-fns"; // Only use date-fns

import * as DateFNS from "date-fns-tz";
const { fromZonedTime } = DateFNS;


async function isSessioninPastWeek(enrollmentId: string, midWeek: Date) {

  const midLastWeek = subDays(midWeek, 7);

  const startOfLastWeek: Date = startOfWeek(midLastWeek);
  const endOfLastWeek: Date = endOfWeek(midLastWeek);

  const { data, error } = await supabase
    .from("Sessions")
    .select("*")
    .gte("date", startOfLastWeek.toISOString())
    .lte("date", endOfLastWeek.toISOString())
    .eq("enrollment_id", enrollmentId);

  if (error) throw error;

  return Object.keys(data).length > 0;
}




export async function getSessionKeys(data?: Session[]) {
  const sessionKeys: Set<string> = new Set();

  if (!data) {
    const { data, error } = await supabase
      .from(Table.Sessions)
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
 * Add sessions for enrollments within the specified week range
 * @param weekStartString - ISO string of week start in Eastern Time
 * @param weekEndString - ISO string of week end in Eastern Time
 * @param enrollments - List of enrollments to create sessions for
 * @param sessions - Existing sessions to avoid duplicates
 * @returns Newly created sessions
 */
export async function addSessionsServer(
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
          console.error("Error processing time for %s %s-%s:", day, startTime, endTime, err)
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


export async function getActiveSessionFromMeetingID(meetingID: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from(Table.Sessions)
    .select("*")
    .eq("meeting_id", meetingID)
    .eq("is_active", true); // adjust this column name as per your schema
}
import { getSupabase } from "../supabase-server/serverClient";
import { scheduleMultipleSessionReminders } from "../twilio";
import { tableToIntefaceProfiles } from "../type-utils";

export async function getSessions(
  start: string,
  end: string
): Promise<Session[]> {
  try {
    const supabase = getSupabase();

    const { data: sessionData, error: sessionError } = await supabase
      .from(Table.Sessions)
      .select("*")
      .gt("date", start)
      .lt("date", end);

    if (sessionError) throw sessionError;

    const sessions: Session[] = await Promise.all(
      sessionData.map(async (session: any) => ({
        id: session.id,
        enrollmentId: session.enrollment_id,
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
        duration: session.duration,
      }))
    );

    return sessions;
  } catch (error) {
    console.error("Error fetching sessions: ", error);
    throw error;
  }
}



export async function getAllSessionsServer(
  startDate?: string,
  endDate?: string,
  orderBy?: string,
  ascending?: boolean
): Promise<Session[]> {
  try {
    let query = supabase.from(Table.Sessions).select(`
      id,
      enrollment_id,
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
      session_exit_form,
      duration,
      meetings:Meetings!meeting_id(*),
      student:Profiles!student_id(*),
      tutor:Profiles!tutor_id(*)
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

    const sessions: Session[] = await Promise.all(
      data.map(async (session: any) => ({
        id: session.id,
        enrollmentId: session.enrollment_id,
        createdAt: session.created_at,
        environment: session.environment,
        date: session.date,
        summary: session.summary,
        // meetingId: session.meeting_id,
        // meeting: await getMeeting(session.meeting_id),
        meeting: session.meetings,
        student: await tableToIntefaceProfiles(session.student),
        tutor: await tableToIntefaceProfiles(session.tutor),
        // student: await getProfileWithProfileId(session.student_id),
        // tutor: await getProfileWithProfileId(session.tutor_id),
        status: session.status,
        session_exit_form: session.session_exit_form,
        isQuestionOrConcern: Boolean(session.is_question_or_concern),
        isFirstSession: Boolean(session.is_first_session),
        duration: session.duration,
      }))
    );
    console.log("Sessions", sessions);

    return sessions;
  } catch (error) {
    console.error("Error fetching sessions", error);
    return [];
  }
}

export async function updateSessionParticipantion(meetingID: string) {}
