import { Enrollment } from "@/types";
import { Table } from "../supabase/tables";
import { supabase } from "./user.actions";
import { SharedEnrollment } from "@/types/enrollment";

export async function getAccountEnrollments(userId: string) {
  console.log(userId);

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
