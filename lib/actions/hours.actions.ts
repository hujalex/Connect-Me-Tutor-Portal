import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Profile,
  Session,
  Notification,
  Event,
  Enrollment,
  Meeting,
} from "@/types";
import {
  deleteScheduledEmailBeforeSessions,
  sendScheduledEmailsBeforeSessions,
  updateScheduledEmailBeforeSessions,
} from "./email.server.actions";
import { getProfileWithProfileId, getProfileByEmail } from "./user.actions";
import {
  addDays,
  format,
  parse,
  parseISO,
  isBefore,
  isAfter,
  areIntervalsOverlapping,
  addHours,
  isValid,
  setHours,
  setMinutes,
} from "date-fns"; // Only use date-fns
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import ResetPassword from "@/app/(public)/set-password/page";
import { getStudentSessions } from "./student.actions";
import { date } from "zod";
import { withCoalescedInvoke } from "next/dist/lib/coalesced-function";
import toast from "react-hot-toast";
import { DatabaseIcon, UserRoundIcon } from "lucide-react";
import { SYSTEM_ENTRYPOINTS } from "next/dist/shared/lib/constants";
import { getAllSessions } from "./admin.actions";
// import { getMeeting } from "./meeting.actions";

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export const getAllSessionHours = async (userId: string) => {
  try {
    const { data, error } = await supabase.rpc("get_all_session_hours", {
      input_user_id: userId,
    });

    if (error) throw error;
    return data || 0;
  } catch (error) {
    console.error("Error getting all session hours:", error);
    throw new Error(
      `Failed to get session hours for user ${userId}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
export const getAllSessionHoursWithStudent = async (
  tutorId: string,
  studentId: string
) => {
  try {
    const { data, error } = await supabase.rpc(
      "get_all_session_hours_with_student",
      { input_tutor_id: tutorId, input_student_id: studentId }
    );

    toast.success(data);

    if (error) throw error;

    return data || 0;
  } catch (error) {
    console.error("Error getting session hours with student:", error);
    throw new Error(
      `Failed to get session hours for tutor ${tutorId} and student ${studentId}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getSessionHoursRange = async (
  userId: string,
  startTime: string,
  endTime: string
) => {
  try {
    const { data, error } = await supabase
      .from("Sessions")
      .select("duration.sum()")
      .eq("tutor_id", userId)
      .eq("status", "Completed")
      .gte("date", startTime)
      .lte("date", endTime);

    if (error) throw error;

    return data?.[0]?.sum || 0;
  } catch (error) {
    console.error("Error getting session hours range:", error);
    throw new Error(
      `Failed to get session hours range for user ${userId} between ${startTime} and ${endTime}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getSessionHoursRangeWithStudent = async (
  tutorId: string,
  studentId: string,
  startTime: string,
  endTime: string
) => {
  try {
    const { data, error } = await supabase
      .from("Sessions")
      .select("duration.sum()")
      .eq("tutor_id", tutorId)
      .eq("student_id", studentId)
      .eq("status", "Completed")
      .gte("date", startTime)
      .lte("date", endTime);

    if (error) throw error;

    return data?.[0]?.sum || 0;
  } catch (error) {
    console.error("Error getting session hours range with student:", error);
    throw new Error(
      `Failed to get session hours range for tutor ${tutorId} and student ${studentId} between ${startTime} and ${endTime}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getAllEventHours = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("Events")
      .select("hours.sum()")
      .eq("tutor_id", userId);

    if (error) throw error;

    return data?.[0]?.sum || 0;
  } catch (error) {
    console.error("Error getting all event hours:", error);
    throw new Error(
      `Failed to get event hours for user ${userId}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getEventHoursRange = async (
  userId: string,
  startTime: string,
  endTime: string
) => {
  try {
    const { data, error } = await supabase
      .from("Events")
      .select("hours.sum()")
      .eq("tutor_id", userId)
      .gte("date", startTime)
      .lte("date", endTime);

    if (error) throw error;

    return data?.[0]?.sum || 0;
  } catch (error) {
    console.error("Error getting event hours range:", error);
    throw new Error(
      `Failed to get event hours range for user ${userId} between ${startTime} and ${endTime}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getAllHours = async (userId: string) => {
  try {
    const allSessionHours = await getAllSessionHours(userId);
    const allEventHours = await getAllEventHours(userId);
    return allSessionHours + allEventHours;
  } catch (error) {
    console.error("Error getting all hours:", error);
    throw new Error(
      `Failed to get total hours for user ${userId}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};

export const getAllHoursRange = async (
  userId: string,
  startTime: string,
  endTime: string
) => {
  try {
    const sessionHoursRange = await getSessionHoursRange(
      userId,
      startTime,
      endTime
    );
    const eventHoursRange = await getEventHoursRange(
      userId,
      startTime,
      endTime
    );
    return sessionHoursRange + eventHoursRange;
  } catch (error) {
    console.error("Error getting all hours range:", error);
    throw new Error(
      `Failed to get total hours range for user ${userId} between ${startTime} and ${endTime}: ${
        error instanceof Error ? error.message : "Unknown error"
      }`
    );
  }
};
