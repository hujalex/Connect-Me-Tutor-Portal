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
  start: string,
  end: string
) => {
  try {
    const { data, error } = await supabase.rpc("get_session_hours_range", {
      input_tutor_id: userId,
      input_start_date: start,
      input_end_date: end,
    });

    if (error) throw error;

    return data || 0;
  } catch (error) {
    console.error("Error getting session hours range:", error);
    toast.error("Error getting session hours range");
    throw new Error(
      `Failed to get session hours range for user ${userId} between ${start} and ${end}: ${
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
    const { data, error } = await supabase.rpc(
      "get_session_hours_range_with_student",
      {
        input_tutor_id: tutorId,
        input_student_id: studentId,
        input_start_date: startTime,
        input_end_date: endTime,
      }
    );

    if (error) throw error;
    return data || 0;
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
    const { data, error } = await supabase.rpc("get_all_event_hours", {
      input_user_id: userId,
    });

    if (error) throw error;

    return data || 0;
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
  start: string,
  end: string
) => {
  try {
    const { data, error } = await supabase.rpc("get_event_hours_range", {
      input_user_id: userId,
      input_start_date: start,
      input_end_date: end,
    });

    if (error) throw error;

    return data || 0;
  } catch (error) {
    console.error("Error getting event hours range:", error);
    throw new Error(
      `Failed to get event hours range for user ${userId} between ${start} and ${end}: ${
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

export const getAllHoursBatch = async () => {
  try {
    const { data: hoursJson, error: rpcError } = await supabase.rpc(
      "get_all_hours_batch"
    );

    if (rpcError) throw rpcError;

    return hoursJson;
  } catch (error) {
    console.error("Error getting tutor hours:", error);
    throw error;
  }
};

export const getHoursBatch = async (profiles: Profile[]) => {};

export const getAllEventHoursBatchWithType = async (type: string) => {
  try {
    //set tutor_ids to null to fetch all
    const { data: hoursJson, error } = await supabase.rpc(
      "get_all_event_hours_batch_with_type",
      { event_type: type }
    );

    if (error) throw error;

    return hoursJson;
  } catch (error) {
    console.error("Error getting event hours:", error);
    throw error;
  }
};

export const getAllEventHoursBatch = async () => {
  try {
    const { data: hoursJson, error } = await supabase.rpc(
      "get_all_event_hours_batch"
    );
    if (error) throw error;
    return hoursJson;
  } catch (error) {
    console.error("Error getting event hours:", error);
    throw error;
  }
};

export const getSessionHoursRangeBatch = async (start: string, end: string) => {
  try {
    const { data: hoursJson, error } = await supabase.rpc(
      "get_session_hours_range_batch",
      { start_date: start, end_date: end }
    );
    if (error) throw error;
    return hoursJson;
  } catch (error) {
    console.error("Error Session Range hours:", error);
    throw error;
  }
};

export const getEventHoursRangeBatch = async (start: string, end: string) => {
  try {
    const { data: hoursJson, error } = await supabase.rpc(
      "get_event_hours_range_batch",
      {
        start_date: start,
        end_date: end,
      }
    );

    console.log("Event hours batch", hoursJson);

    if (error) throw error;
    return hoursJson;
  } catch (error) {
    console.error("Error fetching batch Event Range hours:", error);
    throw error;
  }
};

export const getHoursRangeBatch = async (start: string, end: string) => {
  try {
    const { data: hoursJson, error } = await supabase.rpc(
      "get_hours_range_batch",
      { start_date: start, end_date: end }
    );

    if (error) throw error;
    return hoursJson;
  } catch (error) {
    console.error("Error fetching batch Range hours:", error);
    throw error;
  }
};

export const getAllSessionHoursBatch = async () => {
  try {
    const { data: hoursJson, error } = await supabase.rpc(
      "get_all_session_hours_batch"
    );
    if (error) throw error;
    return hoursJson;
  } catch (error) {
    console.error("Error fetching batch session hours");
    throw error;
  }
};

export const getTotalSessionHoursRange = async (start: string, end: string) => {
  try {
    const { data: hoursJson, error } = await supabase.rpc(
      "get_total_session_hours_range",
      {
        start_date: start,
        end_date: end,
      }
    );
    if (error) throw error;
    return hoursJson;
  } catch (error) {
    console.error("Error fetching total session hours");
    throw error;
  }
};

export const getTotalEventHoursRange = async (start: string, end: string) => {
  try {
    const { data: hoursJson, error } = await supabase.rpc(
      "get_total_event_hours_range",
      {
        start_date: start,
        end_date: end,
      }
    );
    if (error) throw error;
    return hoursJson;
  } catch (error) {
    console.error("Error fetching total session hours", error);
    throw error;
  }
};

export const getTotalHoursRange = async (start: string, end: string) => {
  try {
    const { data: hoursJson, error } = await supabase.rpc(
      "get_total_hours_range",
      {
        start_date: start,
        end_date: end,
      }
    );
    if (error) throw error;
    return hoursJson;
  } catch (error) {
    console.error("Error fetching tutor hours range", error);
    throw error;
  }
};

export const getTotalHours = async () => {
  try {
    const { data, error } = await supabase.rpc("get_total_hours");
    if (error) throw error;
    return data;
  } catch (error) {
    console.error("Error fetching tutor hours", error);
    throw error;
  }
};
/**
 * 
 * BEGIN
    RETURN (
        SELECT jsonb_object_agg(
            at.tutor_id::text,
            COALESCE(st.session_hours, 0) + COALESCE(et.event_hours, 0)
        )
        FROM (
            SELECT DISTINCT tutor_id FROM (
                SELECT tutor_id FROM "Sessions" 
                WHERE status = 'Complete' 
                AND (tutor_ids IS NULL OR tutor_id::text IN (
                    SELECT jsonb_array_elements_text(tutor_ids)
                ))
                UNION
                SELECT tutor_id FROM "Events"
                WHERE (tutor_ids IS NULL OR tutor_id::text IN (
                    SELECT jsonb_array_elements_text(tutor_ids)
                ))
            ) t
        ) at
        LEFT JOIN (
            SELECT tutor_id, COALESCE(SUM(duration), 0) as session_hours
            FROM "Sessions"
            WHERE status = 'Complete'
            AND (tutor_ids IS NULL OR tutor_id::text IN (
                SELECT jsonb_array_elements_text(tutor_ids)
            ))
            GROUP BY tutor_id
        ) st ON at.tutor_id = st.tutor_id
        LEFT JOIN (
            SELECT tutor_id, COALESCE(SUM(hours), 0) as event_hours
            FROM "Events"
            WHERE (tutor_ids IS NULL OR tutor_id::text IN (
                SELECT jsonb_array_elements_text(tutor_ids)
            ))
            GROUP BY tutor_id
        ) et ON at.tutor_id = et.tutor_id
    );
END;
 */
