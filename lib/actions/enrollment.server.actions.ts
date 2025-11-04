import { Enrollment } from "@/types";
import { createClient } from "../supabase/server";
import { Table } from "../supabase/tables";


/* ENROLLMENTS */
export async function getAllActiveEnrollmentsServer(endOfWeek: string): Promise<Enrollment[]> {
  try {
    const supabase = await createClient();
    console.log("Fetching Enrollments")
    // Fetch meeting details from Supabase
    const { data, error } = await supabase.from(Table.Enrollments).select(`
        id,
        created_at,
        summary,
        student_id,
        tutor_id,
        start_date,
        end_date,
        availability,
        meetingId,
        paused,
        duration,
        frequency,
        student:Profiles!student_id(*),
        tutor:Profiles!tutor_id(*)
      `)
      .eq('paused', false)
      .lte('start_date', endOfWeek);

    // Check for errors and log them
    if (error) {
      console.error("Error fetching event details:", error.message);
      throw error;
    }

    // Check if data exists
    if (!data) {
      throw new Error("No data fetched")
    }

    // Mapping the fetched data to the Notification object
    const enrollments: Enrollment[] = await Promise.all(
      data.map(async (enrollment: any) => ({
        createdAt: enrollment.created_at,
        id: enrollment.id,
        summary: enrollment.summary,
        student: enrollment.student,
        tutor: enrollment.tutor,
        startDate: enrollment.start_date,
        endDate: enrollment.end_date,
        availability: enrollment.availability,
        meetingId: enrollment.meetingId,
        paused: enrollment.paused,
        duration: enrollment.duration,
        frequency: enrollment.frequency,
      }))
    );

    return enrollments; // Return the array of enrollments
  } catch (error) {
    console.error("Error getting needed enrollment information:", error);
    throw error;
  }
}
