"use server";
// zoomLogger.ts
import { createClient } from "@supabase/supabase-js";

// Init Supabase client
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY! // Service role key required for inserting rows
);

// Typescript type (optional)
interface ZoomParticipantData {
  session_id: string; // UUID of the session (Zoom meeting UUID)
  user_id?: string; // Optional internal user ID
  user_name: string;
  participant_uuid: string;
  email?: string;
  date_time: string; // ISO format datetime of join
  leave_time?: string; // ISO format datetime of leave
  leave_reason?: string;
}

export interface ParticipationRecord {
  id: string;
  session_id: string;
  user_id: string | null;
  user_name: string;
  participant_uuid: string;
  email: string | null;
  date_time: string;
  leave_time: string | null;
  leave_reason: string | null;
}

/**
 * Log Zoom Account Activity (participant joined)
 * @param participant
 * @returns
 */
export async function logZoomMetadata(participant: ZoomParticipantData) {
  const { data, error } = await supabase.from("session_participation").insert([
    {
      session_id: participant.session_id,
      user_id: participant.user_id || null,
      user_name: participant.user_name,
      participant_uuid: participant.participant_uuid,
      email: participant.email || null,
      date_time: participant.date_time,
      leave_time: participant.leave_time || null,
      leave_reason: participant.leave_reason || null,
    },
  ]);

  if (error) {
    console.error("Error logging Zoom metadata:", error);
    throw error;
  }

  return data;
}

/**
 * Update participant leave time when they exit the meeting
 * @param zoomMeetingId - Zoom meeting UUID
 * @param participantUuid - Zoom participant UUID
 * @param leaveTime - ISO format datetime of leave
 * @param leaveReason - Reason for leaving (optional)
 */
export async function updateParticipantLeaveTime(
  zoomMeetingId: string,
  participantUuid: string,
  leaveTime: string,
  leaveReason?: string
) {
  const { data, error } = await supabase
    .from("session_participation")
    .update({
      leave_time: leaveTime,
      leave_reason: leaveReason || null,
    })
    .eq("session_id", zoomMeetingId)
    .eq("participant_uuid", participantUuid)
    .is("leave_time", null) // Only update if leave_time is null (participant still in meeting)
    .select();

  if (error) {
    console.error("Error updating participant leave time:", error);
    throw error;
  }

  return data;
}

/**
 * Get participation records by Zoom meeting UUID
 * @param zoomMeetingId - Zoom meeting UUID
 * @returns Array of participation records
 */
export async function getParticipationByZoomMeetingId(
  zoomMeetingId: string
): Promise<ParticipationRecord[]> {
  const { data, error } = await supabase
    .from("session_participation")
    .select("*")
    .eq("session_id", zoomMeetingId)
    .order("date_time", { ascending: true });

  if (error) {
    console.error("Error fetching participation data:", error);
    throw error;
  }

  return (data || []) as ParticipationRecord[];
}

/**
 * Get participation records by internal session ID
 * Looks up the Zoom meeting UUID from the session -> meeting relationship
 * @param sessionId - Internal session UUID
 * @returns Array of participation records or null if session/meeting not found
 */
export async function getParticipationBySessionId(
  sessionId: string
): Promise<ParticipationRecord[] | null> {
  try {
    // First get the session with its meeting
    const { data: session, error: sessionError } = await supabase
      .from("Sessions")
      .select("meeting_id, meetings:Meetings!meeting_id(meeting_id)")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Error fetching session:", sessionError);
      return null;
    }

    // Extract Zoom meeting UUID from the meeting
    const meeting = (session as any).meetings;
    if (!meeting || !meeting.meeting_id) {
      console.error("No meeting found for session or missing meeting_id");
      return null;
    }

    const zoomMeetingId = meeting.meeting_id;

    // Get participation records using Zoom meeting UUID
    return await getParticipationByZoomMeetingId(zoomMeetingId);
  } catch (error) {
    console.error("Error in getParticipationBySessionId:", error);
    return null;
  }
}
