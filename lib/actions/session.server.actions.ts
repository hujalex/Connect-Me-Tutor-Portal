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
import { getParticipationBySessionId } from "./zoom.server.actions";

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

export interface ParticipationEvent {
  id: string;
  participantId: string;
  name: string;
  email: string;
  action: "joined" | "left";
  timestamp: string;
}

export interface ParticipationSummary {
  id: string;
  name: string;
  email: string;
  totalDuration: number;
  joinCount: number;
  currentlyInMeeting: boolean;
  firstJoined: string;
  lastActivity: string;
}

export interface ParticipationData {
  session: {
    id: string;
    meetingTitle: string;
    meetingId: string;
    startTime: string;
    endTime: string | null;
    totalDuration: number;
  };
  events: ParticipationEvent[];
  participantSummaries: ParticipationSummary[];
}

export async function getParticipationData(
  sessionId: string
): Promise<ParticipationData | null> {
  try {
    if (!sessionId) {
      return null;
    }

    // Get session details to calculate meeting end time
    const session = await getSessionById(sessionId);

    if (!session) {
      return null;
    }

    // Get participation records
    const participationRecords = await getParticipationBySessionId(sessionId);

    if (!participationRecords) {
      return null;
    }

    // Transform participation records into events format
    const events = participationRecords.flatMap((record) => {
      const events: ParticipationEvent[] = [];

      // Add join event
      events.push({
        id: `${record.id}-join`,
        participantId: record.participant_uuid,
        name: record.user_name,
        email: record.email || "",
        action: "joined",
        timestamp: record.date_time,
      });

      // Add leave event if exists
      if (record.leave_time) {
        events.push({
          id: `${record.id}-leave`,
          participantId: record.participant_uuid,
          name: record.user_name,
          email: record.email || "",
          action: "left",
          timestamp: record.leave_time,
        });
      }

      return events;
    });

    // Sort events by timestamp
    events.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate participant summaries
    const participantMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        totalDuration: number;
        joinCount: number;
        currentlyInMeeting: boolean;
        firstJoined: string;
        lastActivity: string;
      }
    >();

    const sessionStartTime = session.date ? new Date(session.date) : new Date();
    const sessionEndTime = session.duration
      ? new Date(sessionStartTime.getTime() + session.duration * 60 * 1000)
      : null;

    events.forEach((event) => {
      if (!participantMap.has(event.participantId)) {
        participantMap.set(event.participantId, {
          id: event.participantId,
          name: event.name,
          email: event.email,
          totalDuration: 0,
          joinCount: 0,
          currentlyInMeeting: false,
          firstJoined: event.timestamp,
          lastActivity: event.timestamp,
        });
      }

      const summary = participantMap.get(event.participantId)!;
      summary.lastActivity = event.timestamp;

      if (event.action === "joined") {
        summary.joinCount++;
        summary.currentlyInMeeting = true;
      } else {
        summary.currentlyInMeeting = false;
      }
    });

    // Calculate durations for each participant
    participantMap.forEach((summary) => {
      const userEvents = events.filter((e) => e.participantId === summary.id);
      let totalDuration = 0;
      let joinTime: Date | null = null;

      userEvents.forEach((event) => {
        if (event.action === "joined") {
          joinTime = new Date(event.timestamp);
        } else if (event.action === "left" && joinTime) {
          const leaveTime = new Date(event.timestamp);
          totalDuration +=
            (leaveTime.getTime() - joinTime.getTime()) / (1000 * 60);
          joinTime = null;
        }
      });

      // If still in meeting, calculate duration until session end or now
      if (joinTime && summary.currentlyInMeeting) {
        const endTime = sessionEndTime || new Date();
        totalDuration += (endTime.getTime() - joinTime.getTime()) / (1000 * 60);
      }

      summary.totalDuration = Math.round(totalDuration);
    });

    const participantSummaries = Array.from(participantMap.values()).sort(
      (a, b) => b.totalDuration - a.totalDuration
    );

    return {
      session: {
        id: session.id,
        meetingTitle: session.meeting?.name || "Tutoring Session",
        meetingId: session.meeting?.meetingId || "",
        startTime: session.date,
        endTime: sessionEndTime?.toISOString() || null,
        totalDuration: session.duration || 0,
      },
      events,
      participantSummaries,
    };
  } catch (error) {
    console.error("Error fetching participation data:", error);
    return null;
  }
}

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
