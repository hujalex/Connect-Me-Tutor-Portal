"use server";

import crypto from "crypto";
import { createClient } from "../supabase/server";
import { AdminConversation } from "@/types/chat";
import { getUserFromAction } from "./user.server.actions";
import { getUserFromId } from "./admin.actions";

export const createAdminConversation = async (profile_id: string) => {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error("Missing Supabase environment variables");
  }
  const supabase = createClient();

  const createdConversationID = await fetchUserAdminConversations(
    profile_id,
    false
  );

  const user = await getUserFromId(profile_id);
  if (!user) throw new Error("failed to locate profile");

  console.log("created ID: ", createdConversationID);
  if (createdConversationID) return createdConversationID;

  const conversationID = crypto.randomUUID();
  const result = await supabase.from("conversations").insert([
    {
      id: conversationID,
      admin_conversation: true,
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

  return conversationID;
};

export async function fetchUserAdminConversations(
  profile_id: string,
  createIfNull: boolean = true
) {
  if (
    !process.env.NEXT_PUBLIC_SUPABASE_URL ||
    !process.env.SUPABASE_SERVICE_ROLE_KEY ||
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  ) {
    throw new Error("Missing Supabase environment variables");
  }
  const supabase = createClient();
  const requestorProfile = await getUserFromAction();
  if (!requestorProfile) return null;
  const { data } = await supabase
    .rpc("get_client_admin_conversations", {
      profile_id: requestorProfile.id,
    })
    .single();
  const result = data as AdminConversation;

  if (result) return result.conversation_id;
  if (createIfNull) await createAdminConversation(profile_id);
  return null;
}
