// lib/student.actions.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Profile, Session, Meeting } from "@/types";
import { getProfileWithProfileId } from "./user.actions";
import { string } from "zod";

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
