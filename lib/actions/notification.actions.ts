import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import { Notification } from "@/types";
import { getProfileWithProfileId } from "./user.actions";

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/**
 * Fetches all notification records from the database, populating student and tutor details.
 *
 * @returns A promise that resolves to an array of Notification objects, or null if an error occurs or no notifications are found.
 */
export async function getAllNotifications(): Promise<Notification[] | null> {
  try {
    // Fetch meeting details from Supabase
    const { data, error } = await supabase.from("Notifications").select(`
        id,
        created_at,
        session_id,
        previous_date,
        suggested_date,
        tutor_id,
        student_id,
        status,
        summary
      `);

    // Check for errors and log them
    if (error) {
      console.error("Error fetching notification details:", error.message);
      return null; // Returning null here is valid since the function returns Promise<Notification[] | null>
    }

    // Check if data exists
    if (!data) {
      console.log("No notifications found:");
      return null; // Valid return
    }

    // Mapping the fetched data to the Notification object
    const notifications: Notification[] = await Promise.all(
      data.map(async (notification: any) => ({
        createdAt: notification.created_at,
        id: notification.id,
        summary: notification.summary,
        sessionId: notification.session_id,
        previousDate: notification.previous_date,
        suggestedDate: notification.suggested_date,
        student: await getProfileWithProfileId(notification.student_id),
        tutor: await getProfileWithProfileId(notification.tutor_id),
        status: notification.status,
      }))
    );

    return notifications; // Return the array of notifications
  } catch (error) {
    console.error("Unexpected error in getMeeting:", error);
    return null; // Valid return
  }
}

/**
 * Updates the status of a specific notification.
 *
 * @param notificationId - The ID of the notification to update.
 * @param status - The new status for the notification ("Active" or "Resolved").
 * @returns A promise that resolves to the data returned by the supabase update operation.
 * @throws Will throw an error if the update fails
 */
export const updateNotification = async (
  notificationId: string,
  status: "Active" | "Resolved"
) => {
  try {
    const { data, error } = await supabase
      .from("Notifications") // Adjust this table name to match your database
      .update({ status: status }) // Update the status field
      .eq("id", notificationId); // Assuming `id` is the primary key for the notifications table

    if (error) {
      throw error; // Handle the error as needed
    }

    return data; // Return the updated notification data or whatever is needed
  } catch (error) {
    console.error("Error updating notification:", error);
    throw new Error("Failed to update notification");
  }
};
