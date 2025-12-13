import { Enrollment } from "@/types";
import { Table } from "../supabase/tables";
import { supabase } from "@/lib/supabase/client";
import { SharedEnrollment } from "@/types/enrollment";
import {
  format,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  parseISO,
  isAfter,
  isValid,
  previousDay,
} from "date-fns";

export async function getAccountEnrollments(userId: string) {

  const { data, error } = await supabase.rpc(
    "get_user_enrollments_with_profiles",
    {
      requestor_auth_id: userId,
    }
  );

  if (error) {
    console.error("Error fetching enrollments:", error);
    return null;
  }

  return (data as SharedEnrollment[]) || ([] as SharedEnrollment[]);
}

const sql = `
 SELECT * FROM ${Table.Enrollments} LEFT JOIN ${Table.Profiles} ON ${Table.Profiles}.user_id = some inputted ID  WHERE tutor_id = ${Table.Profiles}.id OR student_id = ${Table.Profiles}.id
 ORDER BY created_at DESC
`;


/**
 *@returns Prints to console enrollments where the corresponding past two sessions for the given enrollment haven't been filled out
 */

export const getEnrollmentsWithMissingSEF = async () => {
  try {

    const { data: sessions, error: fetchSessionError } = await supabase.from("Sessions").select()

    const { data: enrollments, error: fetchEnrollmentsError} = await supabase.from("Enrollments").select()

  } catch (error) {
    console.error("Unable to filter ", error)
    throw error
  }

}