import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { Enrollment } from "@/types";
import { getProfileWithProfileId } from "./user.actions";
import { isValidUUID } from "@/lib/utils";

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/**
 * Creates an Enrollment object from various input data and then adds it to the database.
 * This seems to be a helper for migrating or transforming data before enrollment.
 *
 * @param entry - An object containing summary, startDate, endDate, availability, and meetingId.
 * @param studentData - Data representing the student for the enrollment.
 * @param tutorData - Data representing the tutor for the enrollment.
 * @returns A promise that resolves to the result of the `addEnrollment` function call (likely the created Enrollment).
 */
export const createEnrollment = async (
  entry: any,
  studentData: any,
  tutorData: any
) => {
  const migratedPairing: Enrollment = {
    id: "",
    createdAt: "",
    student: studentData,
    tutor: tutorData,
    summary: entry.summary,
    startDate: entry.startDate,
    endDate: entry.endDate,
    availability: entry.availability,
    meetingId: entry.meetingId,
  };

  return await addEnrollment(migratedPairing);
};

/**
 * Fetches all enrollment records from the database, populating student and tutor details.
 *
 * @returns A promise that resolves to an array of Enrollment objects, or null if an error occurs or no enrollments are found.
 */
export async function getAllEnrollments(): Promise<Enrollment[] | null> {
  try {
    // Fetch meeting details from Supabase
    const { data, error } = await supabase.from("Enrollments").select(`
        id,
        created_at,
        summary,
        student_id,
        tutor_id,
        start_date,
        end_date,
        availability,
        meetingId
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
    const enrollments: Enrollment[] = await Promise.all(
      data.map(async (enrollment: any) => ({
        createdAt: enrollment.created_at,
        id: enrollment.id,
        summary: enrollment.summary,
        student: await getProfileWithProfileId(enrollment.student_id),
        tutor: await getProfileWithProfileId(enrollment.tutor_id),
        startDate: enrollment.start_date,
        endDate: enrollment.end_date,
        availability: enrollment.availability,
        meetingId: enrollment.meetingId,
      }))
    );

    return enrollments; // Return the array of enrollments
  } catch (error) {
    console.error("Unexpected error in getMeeting:", error);
    return null;
  }
}

/**
 * Updates an existing enrollment record in the database.
 *
 * @param enrollment - The Enrollment object containing the updated data. Must include an ID.
 * @returns A promise that resolves to the updated enrollment data from Supabase.
 * @throws Will throw an error if the update operation fails.
 */
export const updateEnrollment = async (enrollment: Enrollment) => {
  const { data, error } = await supabase
    .from("Enrollments")
    .update({
      student_id: enrollment.student?.id,
      tutor_id: enrollment.tutor?.id,
      summary: enrollment.summary,
      start_date: enrollment.startDate,
      end_date: enrollment.endDate,
      availability: enrollment.availability,
      meetingId: enrollment.meetingId,
    })
    .eq("id", enrollment.id)
    .select("*") // Ensure it selects all columns
    .single(); // Ensure only one object is returned

  if (error) {
    console.error("Error updating enrollment:", error);
    throw error;
  }

  return data;
};

/**
 * Adds a new enrollment record to the database.
 *
 * @param enrollment - The enrollment data to add, excluding 'id' and 'createdAt' which are auto-generated.
 *                     Requires student, and validates meetingId if provided.
 * @returns A promise that resolves to the newly created and fully populated Enrollment object.
 * @throws Will throw an error if student is missing, meetingId is invalid, or database insertion fails.
 */
export const addEnrollment = async (
  enrollment: Omit<Enrollment, "id" | "createdAt">
) => {
  console.log(enrollment);
  if (!enrollment.student) throw new Error("Please select a Student");

  if (enrollment.meetingId && !isValidUUID(enrollment.meetingId)) {
    throw new Error("Invalid or no meeting link");
  }

  const { data, error } = await supabase
    .from("Enrollments")
    .insert({
      student_id: enrollment.student?.id,
      tutor_id: enrollment.tutor?.id,
      summary: enrollment.summary,
      start_date: enrollment.startDate,
      end_date: enrollment.endDate,
      availability: enrollment.availability,
      meetingId: enrollment.meetingId,
    })
    .select(`*`)
    .single();

  if (error) {
    console.error("Error adding enrollment:", error);
    throw error;
  }

  console.log(data);

  return {
    createdAt: data.created_at,
    id: data.id,
    summary: data.summary,
    student: await getProfileWithProfileId(data.student_id),
    tutor: await getProfileWithProfileId(data.tutor_id),
    startDate: data.start_date,
    endDate: data.end_date,
    availability: data.availability,
    meetingId: data.meetingId,
  };
};

/**
 * Deletes an enrollment record from the database by its ID.
 *
 * @param enrollmentId - The ID of the enrollment to remove.
 * @returns A promise that resolves to the data returned by the Supabase delete operation (often null or an empty array on success).
 * @throws Will throw an error if the deletion fails.
 */
export const removeEnrollment = async (enrollmentId: string) => {
  const { data, error } = await supabase
    .from("Enrollments")
    .delete()
    .eq("id", enrollmentId);

  if (error) {
    console.error("Error removing enrollment:", error);
    throw error;
  }

  return data;
};
