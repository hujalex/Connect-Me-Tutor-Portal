import crypto from "crypto";

("use server");

import { createClient } from "../supabase/server";

export const createAdminConversation = async (profile_id: string) => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error("Missing Supabase environment variables");
  }
  const supabase = createClient();
  const conversationID = crypto.randomUUID();
  const result = await supabase.from("conversations").insert([
    {
      id: conversationID,
    },
  ]);

  if (result.error) return console.error(result.error);
  const createdParticipantResult = await supabase
    .from("conversation_participant")
    .insert([
      {
        conversation_id: conversationID,
        profile_id,
      },
    ]);

  console.log("created participant result: ", createdParticipantResult);
};
