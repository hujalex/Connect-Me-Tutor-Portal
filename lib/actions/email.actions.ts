import { Session } from "@/types";
import { toast } from "react-hot-toast";
import { Client } from "@upstash/qstash";
import { Profile } from "@/types";
import { getProfileWithProfileId } from "./user.actions";
import { createClient } from "../supabase/server";
const qstash = new Client({ token: process.env.QSTASH_TOKEN });

/**
 * Sends requests to an API endpoint to schedule reminder emails for a list of sessions.
 *
 * @param sessions - An array of Session objects for which to schedule emails.
 * @returns A promise that resolves when all scheduling requests have been attempted.
 * @throws Will throw an error if any API request fails and is not caught internally.
 */
export async function sendScheduledEmailsBeforeSessions(sessions: Session[]) {
  try {
    sessions.forEach(async (session) => {
      //Check Settings
      if (session.tutor) {
        const profile: Profile = await getProfileWithProfileId(
          session.tutor?.id
        );

        const { data, error } = await supabase;
      }
      const response = await fetch(
        "/api/email/before-sessions/schedule-reminder",
        {
          method: "POST",
          body: JSON.stringify({ session }),
          headers: {
            "Content-Type": "applications/json",
          },
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Unable to schedule emails");
      }
    });

    toast.success("Session Emails Scheduled");
  } catch (error) {
    console.error("Error scheduling session emails", error);
    throw error;
  }
}

/**
 * Updates a scheduled reminder email for a session by deleting the old one and scheduling a new one.
 *
 * @param session - The Session object with updated details.
 * @returns A promise that resolves when the update process is complete.
 * @throws Will throw an error if deletion or scheduling fails.
 */
export async function updateScheduledEmailBeforeSessions(session: Session) {
  try {
    await deleteScheduledEmailBeforeSessions(session.id);
    await sendScheduledEmailsBeforeSessions([session]);
    toast.success("Successfully updated scheduled reminder");
  } catch (error) {
    console.error("Unable to update scheduled message");
    throw error;
  }
}

/**
 * Sends a request to an API endpoint to delete a scheduled reminder email for a specific session.
 *
 * @param sessionId - The ID of the session whose scheduled email is to be deleted.
 * @returns A promise that resolves when the deletion request has been attempted.
 * @throws Will throw an error if the API request fails.
 */
export async function deleteScheduledEmailBeforeSessions(sessionId: string) {
  try {
    const response = await fetch("/api/email/before-sessions/delete-reminder", {
      method: "POST",
      body: JSON.stringify({ sessionId }),
      headers: {
        "Content-Type": "applications/json",
      },
    });

    if (!response.ok) {
      throw new Error("Unable to delete scheduled email");
    }

    toast.success("Deleted Scheduled Email");
  } catch (error) {
    console.error("Unable to delete message");
    throw error;
  }
}

export async function deleteMsg(messageId: string) {
  try {
    await qstash.messages.delete(messageId);
    console.log("Successfully deleted message from QStash");
  } catch (qstashError: any) {
    console.warn("Failed to delete message from QStash");
  }
}

export async function scheduleEmail({
  notBefore,
  to,
  subject,
  body,
}: {
  notBefore: number;
  to: string;
  subject: string;
  body: string;
}) {
  try {
    const result = await qstash.publishJSON({
      url: `${"https://connectmego.app"}/api/email/send-email`,
      notBefore: notBefore,
      body: {
        to: to,
        subject: subject,
        body: body,
      },
    });

    if (result && result.messageId) {
      console.log("Successfully scheduled message");
    }
    return result;
  } catch (error) {
    console.error("Unable to schedule email");
    throw error;
  }
}
