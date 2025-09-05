"use server";
import { Session } from "@/types";
import { Client } from "@upstash/qstash";
import TutorMatchingNotificationEmail from "@/components/emails/tutor-matching-notification";
import { render } from "@react-email/components";
import React from "react";
import { Resend } from "resend";

export async function fetchScheduledMessages() {
  const qstash = new Client({ token: process.env.QSTASH_TOKEN });

  const messages = await qstash.schedules.list();
  return messages;
}

/**
 * Sends requests to an API endpoint to schedule reminder emails for a list of sessions.
 *
 * @param sessions - An array of Session objects for which to schedule emails.
 * @returns A promise that resolves when all scheduling requests have been attempted.
 * @throws Will throw an error if any API request fails and is not caught internally.
 */
export async function sendScheduledEmailsBeforeSessions(
  sessions: Session[]
): Promise<void> {
  try {
    // Use Promise.all for parallel execution or for...of for sequential
    await Promise.all(
      sessions.map(async (session) => {
        // Check if session has a tutor
        if (!session.tutor) {
          console.warn(`Session ${session.id} has no tutor assigned`);
          return;
        }

        try {
          const response = await fetch(
            `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/before-sessions/schedule-reminder`,
            {
              method: "POST",
              body: JSON.stringify({ session }),
              headers: {
                "Content-Type": "application/json", // Fixed typo
              },
            }
          );

          if (!response.ok) {
            const errorData = await response
              .json()
              .catch(() => ({ message: "Unknown error" }));
            throw new Error(
              errorData.message ||
                `HTTP ${response.status}: Unable to schedule email`
            );
          }

          const data = await response.json();
        } catch (sessionError) {
          console.error(
            "Error processing session %s:",
            session.id,
            sessionError
          );
          // Continue processing other sessions instead of failing entirely
        }
      })
    );
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
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/before-sessions/delete-reminder`,
      {
        method: "POST",
        body: JSON.stringify({ sessionId }),
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error("Unable to delete scheduled email");
    }
  } catch (error) {
    console.error("Unable to delete message");
    // throw error;
  }
}

export async function deleteMsg(messageId: string) {
  const qstash = new Client({ token: process.env.QSTASH_TOKEN });
  try {
    await qstash.messages.delete(messageId);
  } catch (qstashError: any) {
    console.warn("Failed to delete message from QStash");
  }
}

export async function scheduleEmail({
  notBefore,
  to,
  subject,
  body,
  sessionId,
}: {
  notBefore: number;
  to: string;
  subject: string;
  body: string;
  sessionId: string;
}) {
  try {
    const qstash = new Client({ token: process.env.QSTASH_TOKEN });
    const result = await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/email/send-email`,
      //   url: `${"http://localhost:3000"}/api/email/send-email`,
      notBefore: notBefore,
      body: {
        to: to,
        subject: subject,
        body: body,
        sessionId: sessionId,
      },
    });

    if (result && result.messageId) {
    }
    return result;
  } catch (error) {
    console.error("Unable to schedule email");
    throw error;
  }
}

const resend = new Resend(process.env.RESEND_API_KEY);

type EmailData = {
  studentName: string;
  studentGender: string;
  parentName: string;
};

export async function sendPairingEmail(emailType: string, data: EmailData) {
  const allowedEmailTypes: string[] = ["match-accepted"];

  if (!emailType || !allowedEmailTypes.includes(emailType)) {
    throw new Error("Must provide valid email type");
  }

  if (emailType === "match-accepted") {
    console.log("rendering with", data);
    const emailHtml = await render(
      React.createElement(TutorMatchingNotificationEmail, data)
    );
    console.log("email temp: ", emailHtml);

    const emailResult = await resend.emails.send({
      from: "Connect Me Free Tutoring & Mentoring <pairings@connectmego.app>",
      to: "hual.alexander@gmail.com",
      subject: "You Have Been Matched!",
      html: emailHtml,
    });

    console.log("email result:", emailResult);
    return emailResult;
  }

  throw new Error("Unsupported email type");
}
