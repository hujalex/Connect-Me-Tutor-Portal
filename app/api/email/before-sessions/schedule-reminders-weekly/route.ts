import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/types";
import { Profile } from "@/types";
import { createClient } from "@supabase/supabase-js";
import { addMinutes, subMinutes, parseISO } from "date-fns";
import {
  scheduleEmail,
  sendScheduledEmailsBeforeSessions,
} from "@/lib/actions/email.server.actions";
import { getSessions } from "@/lib/actions/session.server.actions";
import { addDays } from "date-fns";

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const weekLater = addDays(now, 7);

    const sessionsNextWeek: Session[] = await getSessions(
      now.toString(),
      weekLater.toString()
    );

    await sendScheduledEmailsBeforeSessions(sessionsNextWeek);

    return NextResponse.json({
      status: 200,
      message: "weekly email notifications scheduled successfully",
    });
  } catch (error) {
    return NextResponse.json({
      status: 500,
      message: "weekly email notifications failed",
    });
  }
}
