import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { Session, Meeting } from "@/types";
import { parseISO, areIntervalsOverlapping, addHours, isValid } from "date-fns"; // Only use date-fns

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export const MEETING_CONFIG = {
  meetings: [
    { name: "Zoom Link A", id: "89d13433-04c3-48d6-9e94-f02103336554" },
    { name: "Zoom Link B", id: "72a87729-ae87-468c-9444-5ff9b073f691" },
    { name: "Zoom Link C", id: "26576a69-afe8-46c3-bc15-dec992989cdf" },
    { name: "Zoom Link D", id: "83cd43b6-ca22-411c-a75b-4fb9c685295b" },
    { name: "Zoom Link E", id: "8d61e044-135c-4ef6-83e8-9df30dc152f2" },
    { name: "Zoom Link F", id: "fc4f7e3a-bb0f-4fc4-9f78-01ca022caf33" },
    { name: "Zoom Link G", id: "132360dc-cad9-4d4c-88f8-3347585dfcf1" },
    { name: "Zoom Link H", id: "f87f8d74-6dc4-4a6c-89b7-717df776715f" },
    { name: "Zoom Link I", id: "c8e6fe57-59e5-4bbf-8648-ed6cac2df1ea" },
  ] as const,
} as const;

export type MeetingName = (typeof MEETING_CONFIG.meetings)[number]["name"];

export function getIdFromMeetingName(meetingName: MeetingName): string {
  const meeting = MEETING_CONFIG.meetings.find((m) => m.name === meetingName);
  if (!meeting) {
    return "";
  }
  return meeting.id;
}

/**
 * Fetches a single meeting record from the database by its ID.
 *
 * @param id - The ID of the meeting to fetch.
 * @returns A promise that resolves to a Meeting object, or null if not found or an error occurs.
 */
export async function getMeeting(meetingId: string): Promise<Meeting | null> {
  try {
    // Fetch meeting details from Supabase
    const { data, error } = await supabase
      .from("Meetings")
      .select(
        `
          id,
          meeting_id,
          link,
          password,
          created_at,
          name
        `
      )
      .eq("id", meetingId)
      .single();

    // Check for errors and log them
    if (error) {
      console.error("Error fetching meeting details:", error.message);
      return null;
    }

    // Check if data exists
    if (!data) {
      console.log("No meeting found with ID:", meetingId);
      return null;
    }

    // Map the fetched data to the Meeting object
    const meeting: Meeting = {
      id: data.id,
      createdAt: data.created_at,
      password: data.password,
      meetingId: data.meeting_id,
      link: data.link,
      name: data.name,
    };

    return meeting;
  } catch (error) {
    console.error("Unexpected error in getMeeting:", error);
    return null;
  }
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
 * Fetches all meeting records from the database.
 *
 * @returns A promise that resolves to an array of Meeting objects, or null if an error occurs or no meetings are found.
 */
export async function getAllMeetings(): Promise<Meeting[] | null> {
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
