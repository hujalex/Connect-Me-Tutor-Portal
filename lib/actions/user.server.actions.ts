"use server";

import { cookies } from "next/headers";
import { createServerActionClient } from "@supabase/auth-helpers-nextjs";

export async function getUserFromAction() {
  const supabase = createServerActionClient({ cookies });

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  return user;
}
