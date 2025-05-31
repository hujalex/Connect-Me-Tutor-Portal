import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

import { Event } from "@/types";

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

/**
 * Fetches all events associated with a specific tutor ID.
 *
 * @param tutorId - The ID of the tutor whose events are to be fetched.
 * @returns A promise that resolves to an array of Event objects. Returns an empty array on error or if no events are found.
 */
export async function getEvents(tutorId: string): Promise<Event[]> {
  try {
    // Fetch meeting details from Supabase
    const { data, error } = await supabase
      .from("Events")
      .select(
        `
        id,
        created_at,
        date,
        summary,
        tutor_id,
        hours
      `
      )
      .eq("tutor_id", tutorId);

    // Check for errors and log them
    if (error) {
      console.error("Error fetching event details:", error.message);
      return []; // Returning null here is valid since the function returns Promise<Notification[] | null>
    }

    // Check if data exists
    if (!data) {
      console.log("No events found:");
      return []; // Valid return
    }

    // Mapping the fetched data to the Notification object
    const events: Event[] = await Promise.all(
      data.map(async (event: any) => ({
        createdAt: event.created_at,
        id: event.id,
        summary: event.summary,
        tutorId: event.tutor_id,
        date: event.date,
        hours: event.hours,
      }))
    );

    return events; // Return the array of notifications
  } catch (error) {
    console.error("Unexpected error in getMeeting:", error);
    return [];
  }
}

/**
 * Fetches events for a specific tutor that fall within a selected month.
 *
 * @param tutorId - The ID of the tutor.
 * @param selectedMonth - An ISO string representing any date within the desired month (e.g., "YYYY-MM-01").
 *                        The function calculates the start and end of this month for filtering.
 * @returns A promise that resolves to an array of Event objects, or null if an error occurs or no events are found.
 */
export async function getEventsWithTutorMonth(
  tutorId: string,
  selectedMonth: string
): Promise<Event[] | null> {
  try {
    // Fetch event details filtered by tutor IDs and selected month
    const { data, error } = await supabase
      .from("Events")
      .select(
        `
        id,
        created_at,
        date,
        summary,
        tutor_id,
        hours
      `
      )
      .eq("tutor_id", tutorId) // Filter by tutor IDs
      .gte("date", selectedMonth) // Filter events from the start of the selected month
      .lt(
        "date",
        new Date(
          new Date(selectedMonth).setMonth(
            new Date(selectedMonth).getMonth() + 1
          )
        ).toISOString()
      ); // Filter before the start of the next month

    // Check for errors and log them
    if (error) {
      console.error("Error fetching event details:", error.message);
      return null;
    }

    // Check if data exists
    if (!data) {
      console.log("No events found:");
      return null;
    }

    // Map the fetched data to the Event object
    const events: Event[] = data.map((event: any) => ({
      createdAt: event.created_at,
      id: event.id,
      summary: event.summary,
      tutorId: event.tutor_id,
      date: event.date,
      hours: event.hours,
    }));

    return events; // Return the array of events
  } catch (error) {
    console.error("Unexpected error in getEventsWithTutorMonth:", error);
    return null;
  }
}

/**
 * Creates a new event record in the database.
 *
 * @param event - The Event object containing data for the new event.
 * @returns A promise that resolves when the event creation is attempted.
 * @throws Will throw an error if the database insertion fails.
 */
export async function createEvent(event: Event) {
  // Create a notification for the admin
  const { error: eventError } = await supabase.from("Events").insert({
    date: event.date,
    summary: event.summary,
    tutor_id: event.tutorId,
    hours: event.hours,
  });

  if (eventError) {
    throw eventError;
  }
}

/**
 * Deletes an event record from the database by its ID.
 *
 * @param eventId - The ID of the event to remove.
 * @returns A promise that resolves to true if deletion was successful (at least one row affected), false otherwise.
 * @throws Will throw an error if the database operation itself fails.
 */
export async function removeEvent(eventId: string): Promise<boolean> {
  try {
    // Validate eventId format
    if (!eventId || typeof eventId !== "string") {
      console.error("Invalid event ID provided:", eventId);
      return false;
    }

    // Attempt to delete the event
    const { data, error, count } = await supabase
      .from("Events")
      .delete()
      .eq("id", eventId)
      .select(); // Add this to get back the deleted record

    if (error) {
      console.error("Error deleting event:", error);
      throw error;
    }

    // Check if any records were actually deleted
    if (!data || data.length === 0) {
      console.warn(`No event found with ID: ${eventId}`);
      return false;
    }

    console.log(`Successfully deleted event with ID: ${eventId}`);
    return true;
  } catch (error) {
    console.error("Failed to remove event:", error);
    throw error;
  }
}
