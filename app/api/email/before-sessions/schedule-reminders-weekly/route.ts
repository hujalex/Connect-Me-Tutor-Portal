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

export const dynamic = "force-dynamic"; // prevent prerendering from calling the api and scheduling sessions

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const weekLater = addDays(now, 7);
    const sessionsNextWeek: Session[] = await getSessions(
      now.toISOString(),
      weekLater.toISOString()
    );
    // There is a burst rate of 120
    const batchSize = 50;
    const delayBetweenBatches = 1000;
    for (let i = 0; i < sessionsNextWeek.length; i += batchSize) {
      const batch = sessionsNextWeek.slice(i, i + batchSize);

      await sendScheduledEmailsBeforeSessions(batch);
      if (i + batchSize < sessionsNextWeek.length) {
        await delay(delayBetweenBatches);
      }
    }
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
