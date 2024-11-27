// lib/student.actions.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Profile, Session, Meeting } from "@/types";
import { getProfileWithProfileId } from "./user.actions";

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

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
