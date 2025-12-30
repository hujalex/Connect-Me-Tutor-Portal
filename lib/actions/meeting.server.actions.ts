"use server";
import { Availability, Enrollment, Meeting, Profile, Session } from "@/types";
// import { createClient } from "@supabase/supabase-js";
import { getSupabase } from "../supabase-server/serverClient";
import { createClient } from "@/lib/supabase/server"
import { fetchDaySessionsFromSchedule } from "./session.actions";
import { addHours, areIntervalsOverlapping, isValid, parseISO } from "date-fns";
import { Table } from "../supabase/tables";

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

export async function getMeetings(): Promise<Meeting[] | null> {
  try {
    const supabase = await createClient()
    // Fetch meeting details from Supabase
    const { data, error } = await supabase.from(Table.Meetings).select(`
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
