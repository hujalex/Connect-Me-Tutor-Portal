import { Session } from "@/types";
import { toast } from "react-hot-toast";
import { Client } from "@upstash/qstash";
import { createClient } from "@supabase/supabase-js";
import { Profile } from "@/types";
import { getProfileWithProfileId } from "./user.actions";
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

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
      //   url: `${"http://localhost:3000"}/api/email/send-email`,
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
