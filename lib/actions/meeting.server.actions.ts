"use server";
import { Availability, Enrollment, Meeting, Profile, Session } from "@/types";
import { getSupabase } from "../supabase-server/serverClient";
import { createClient } from "@/lib/supabase/server"
import { fetchDaySessionsFromSchedule } from "./session.actions";
import { addHours, areIntervalsOverlapping, isValid, parseISO } from "date-fns";

export async function getMeeting(id: string): Promise<Meeting | null> {
  try {
    const supabase = await createClient();
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

export const checkAvailableMeeting = async (
  session: Session,
  requestedDate: Date,
  meetings: Meeting[]
): Promise<{ [key: string]: boolean }> => {
  try {
    const sessionsToSearch: Session[] | undefined =
      await fetchDaySessionsFromSchedule(requestedDate);
    const updatedMeetingAvailability: { [key: string]: boolean } = {};
    if (!session.date || !isValid(parseISO(session.date))) {
      throw new Error("Invalid session date selected");
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
                    ? addHours(
                        parseISO(existingSession.date),
                        existingSession.duration
                      )
                    : new Date(),
                }
              )
            );
          })
        : false;
      updatedMeetingAvailability[meeting.id] = !hasConflict;
    });
    return updatedMeetingAvailability;
  } catch (error) {
    throw error;
  }
};

const toDateTime = (time: string, day: Number) => {
  if (!time) {
    return new Date(NaN);
  }
  const [hourStr, minuteStr] = time.split(":");
  const parsedDate = new Date();
  while (parsedDate.getDay() !== day) {
    parsedDate.setDate(parsedDate.getDate() + 1);
  }
  parsedDate.setHours(parseInt(hourStr), parseInt(minuteStr), 0, 0);
  return parsedDate;
};

const formatAvailabilityAsDate = (date: Availability): Date[] => {
  try {
    type DayName =
      | "Sunday"
      | "Monday"
      | "Tuesday"
      | "Wednesday"
      | "Thursday"
      | "Friday"
      | "Saturday";
    const dayMap: { [key in DayName]: number } = {
      Sunday: 0,
      Monday: 1,
      Tuesday: 2,
      Wednesday: 3,
      Thursday: 4,
      Friday: 5,
      Saturday: 6,
    };

    const dayIndex = dayMap[date.day as DayName];
    if (dayIndex === undefined) {
      throw new Error("Invalid Day of the Week");
    }
    return [
      toDateTime(date.startTime, dayIndex),
      toDateTime(date.endTime, dayIndex),
    ];
  } catch (error) {
    console.error("Failed to Format Date", error);

    const date5am = new Date(2024, 1, 23, 5, 0, 0, 0);
    return [date5am, date5am];
  }
};

export const checkAvailableMeetingForEnrollments = async (
  enroll: Omit<Enrollment, "id" | "createdAt">,
  enrollments: Enrollment[],
  meetings: Meeting[]
) => {
  const updatedMeetingAvailability: { [key: string]: boolean } = {};
  meetings.forEach((meeting) => {
    updatedMeetingAvailability[meeting.id] = true;
  });
  const [newEnrollmentStartTime, newEnrollmentEndTime] = enroll.availability[0]
    ? formatAvailabilityAsDate(enroll.availability[0])
    : [new Date(NaN), new Date(NaN)];
  for (const enrollment of enrollments) {
    if (!enrollment?.availability[0] || !enrollment?.meetingId) continue;
    try {
      const [existingStartTime, existingEndTime] = formatAvailabilityAsDate(
        enrollment.availability[0]
      );
      const isOverlap = areIntervalsOverlapping(
        {
          start: newEnrollmentStartTime.getTime(),
          end: newEnrollmentEndTime.getTime(),
        },
        {
          start: existingStartTime.getTime(),
          end: existingEndTime.getTime(),
        }
      );
      if (updatedMeetingAvailability[enrollment.meetingId]) {
        updatedMeetingAvailability[enrollment.meetingId] = !isOverlap;
        if (isOverlap) {
        }
      }
    } catch (error) {
      updatedMeetingAvailability[enrollment.meetingId] = false;
    }
  }
  return updatedMeetingAvailability;
};
