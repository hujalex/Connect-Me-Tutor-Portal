"use server";
import { Session } from "@/types";
import { toast } from "react-hot-toast";
import { Client } from "@upstash/qstash";
import { createClient } from "@supabase/supabase-js";
import { Profile } from "@/types";
import { getProfileWithProfileId } from "./user.actions";
import { getMeeting } from "./meeting.server.actions";
import { createServerClient } from "../supabase/server";
import { Table } from "../supabase/tables";

export async function getActiveSessionFromMeetingID(meetingID: string) {
  const supabase = await createServerClient();

  const { data, error } = await supabase
    .from(Table.Sessions)
    .select("*")
    .eq("meeting_id", meetingID)
    .eq("is_active", true) // adjust this column name as per your schema
    .single();

  if (error) {
    console.error("Error fetching session:", error);
    return null;
  }

  return data;
}
import { getSupabase } from "../supabase-server/serverClient";

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

export async function updateSessionParticipantion(meetingID: string) {}

export async function getSessionById(
  sessionId: string
): Promise<Session | null> {
  try {
    const supabase = getSupabase();

    const { data: sessionData, error: sessionError } = await supabase
      .from(Table.Sessions)
      .select(
        `
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
        meetings:Meetings!meeting_id(*)
      `
      )
      .eq("id", sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error("Error fetching session:", sessionError);
      return null;
    }

    const [student, tutor] = await Promise.all([
      getProfileWithProfileId(sessionData.student_id),
      getProfileWithProfileId(sessionData.tutor_id),
    ]);

    const session: Session = {
      id: sessionData.id,
      enrollmentId: sessionData.enrollment_id,
      createdAt: sessionData.created_at,
      environment: sessionData.environment,
      date: sessionData.date,
      summary: sessionData.summary,
      meeting: sessionData.meetings
        ? await getMeeting(sessionData.meetings.id)
        : null,
      student,
      tutor,
      status: sessionData.status,
      session_exit_form: sessionData.session_exit_form,
      isQuestionOrConcern: Boolean(sessionData.is_question_or_concern),
      isFirstSession: Boolean(sessionData.is_first_session),
      duration: sessionData.duration,
    };

    return session;
  } catch (error) {
    console.error("Error fetching session by ID:", error);
    return null;
  }
}
