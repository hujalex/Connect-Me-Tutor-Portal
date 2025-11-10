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
  participant_id: string;
  name: string;
  email?: string;
  action: "joined" | "left";
  timestamp: string; // ISO format datetime
}

export interface ParticipationRecord {
  id: string;
  participant_id: string;
  name: string;
  email: string;
  action: string;
  timestamp: string;
  session_id: string;
}

/**
 * Log Zoom Account Activity (participant joined or left)
 * @param participant
 * @returns
 */
export async function logZoomMetadata(participant: ZoomParticipantData) {
  const { data, error } = await supabase
    .from("zoom_participant_events")
    .insert([
      {
        session_id: participant.session_id,
        participant_id: participant.participant_id,
        name: participant.name,
        email: participant.email || null,
        action: participant.action,
        timestamp: participant.timestamp,
      },
    ]);

  if (error) {
    console.error("Error logging Zoom metadata:", error);
    throw error;
  }

  return data;
}

/**
 * Log participant leave event when they exit the meeting
 * @param zoomMeetingId - Zoom meeting UUID
 * @param participantId - Zoom participant UUID
 * @param name - Participant name
 * @param email - Participant email (optional)
 * @param leaveTime - ISO format datetime of leave
 */
export async function updateParticipantLeaveTime(
  zoomMeetingId: string,
  participantId: string,
  name: string,
  email: string | null,
  leaveTime: string
) {
  const { data, error } = await supabase
    .from("zoom_participant_events")
    .insert([
      {
        session_id: zoomMeetingId,
        participant_id: participantId,
        name: name,
        email: email,
        action: "left",
        timestamp: leaveTime,
      },
    ])
    .select();

  if (error) {
    console.error("Error logging participant leave event:", error);
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
    .from("zoom_participant_events")
    .select("*")
    .eq("session_id", zoomMeetingId)
    .order("timestamp", { ascending: true });

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
    // The join should be: Sessions.meeting_id -> Meetings.id (primary key)
    // Then we select meeting_id (Zoom UUID) from Meetings
    const { data: session, error: sessionError } = await supabase
      .from("Sessions")
      .select("meeting_id, meetings:Meetings!meeting_id(id, meeting_id)")
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
    const zoomMeetingId = meeting.id;

    // Validate that zoomMeetingId is a valid UUID format
    // UUID format: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx (8-4-4-4-12 hex digits)
    const uuidRegex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(zoomMeetingId)) {
      console.error(
        `Invalid Zoom meeting UUID format: "${zoomMeetingId}". Expected UUID format but got what appears to be a phone number or other invalid value.`
      );
      return null;
    }

    // Get participation records using Zoom meeting UUID
    return await getParticipationByZoomMeetingId(zoomMeetingId);
  } catch (error) {
    console.error("Error in getParticipationBySessionId:", error);
    return null;
  }
}
