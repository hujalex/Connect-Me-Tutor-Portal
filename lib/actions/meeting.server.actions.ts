"use server";
import { Meeting, Session } from "@/types";
import { createClient } from "@supabase/supabase-js";
import { getSupabase } from "../supabase-server/serverClient";
import { fetchDaySessionsFromSchedule } from "./session.actions";
import { addHours, areIntervalsOverlapping, isValid, parseISO } from "date-fns";

export async function getMeeting(id: string): Promise<Meeting | null> {
  try {
    const supabase = getSupabase();
    // Fetch meeting details from Supabase
    const { data, error } = await supabase
      .from("Meetings")
      .select(
        `
        id,
        link,
        meeting_id,
        password,
        created_at,
        name
      `
      )
      .eq("id", id)
      .single();

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
    const meeting: Meeting = {
      id: data.id,
      name: data.name,
      meetingId: data.meeting_id,
      password: data.password,
      link: data.link,
      createdAt: data.created_at,
    };
    return meeting; // Return the array of notifications
  } catch (error) {
    console.error("Unexpected error in getMeeting:", error);
    return null; // Valid return
  }
}

export const checkAvailableMeeting = async (session: Session, requestedDate: Date, meetings: Meeting[]): Promise<{[key: string]: boolean}> => {
    try {
      const sessionsToSearch: Session[] | undefined =
        await fetchDaySessionsFromSchedule(requestedDate);
      const updatedMeetingAvailability: { [key: string]: boolean } = {};
      if (!session.date || !isValid(parseISO(session.date))) {
        throw new Error("Invalid session date selected")
      }
      meetings.forEach((meeting) => {
        updatedMeetingAvailability[meeting.id] = true;
      });
      //
      // const requestedSessionStartTime = parseISO(session.date);\
      const requestedSessionStartTime = requestedDate;
      const requestedSessionEndTime = addHours(
        requestedSessionStartTime,
         session.duration
      );
      meetings.forEach((meeting) => {
        const hasConflict = sessionsToSearch
          ? sessionsToSearch.some((existingSession) => {
              // console.log("Comparison", {existingSession, session})
              return (
                session.id !== existingSession.id &&
                existingSession.meeting?.id === meeting.id &&
                areIntervalsOverlapping(
                  {
                    start: requestedSessionStartTime,
                    end: requestedSessionEndTime,
                  },
                  {
                    start: existingSession.date
                      ? parseISO(existingSession.date)
                      : new Date(),
                    end: existingSession.date
                      ? addHours(parseISO(existingSession.date), existingSession.duration)
                      : new Date(),
                  }
                )
              );
            })
          : false;
        updatedMeetingAvailability[meeting.id] = !hasConflict;
      });
      return updatedMeetingAvailability
    } catch (error) {
      throw error
    } 

  }
