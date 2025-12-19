import { getAllActiveEnrollmentsServer } from "@/lib/actions/enrollment.server.actions";
import { addSessionsServer } from "@/lib/actions/session.server.actions";
import { endOfWeek, startOfWeek } from "date-fns";
import { NextResponse, NextRequest } from "next/server";
import { getAllSessionsServer } from "@/lib/actions/session.server.actions";
import { Session } from "@/types";

export const dynamic = "force-dynamic";


export async function GET() {
  try {
    const newSessions = await handleUpdateWeek();

    return NextResponse.json({ "newSessions": newSessions }, { status: 200 });
  } catch (error) {
    const err = error as Error;
    return NextResponse.json(
      { error: `Update Week error ${err.message}` },
      { status: 500 }
    );
  }
}

const handleUpdateWeek = async (): Promise<Session[]> => {
  try {
    //------Set Loading-------

    const today = new Date();

    const weekStart = startOfWeek(today).toISOString();
    const weekEnd = endOfWeek(today).toDateString();

    const enrollments = await getAllActiveEnrollmentsServer(weekEnd);
    const sessions: Session[] = await getAllSessionsServer(
      weekStart,
      weekEnd,
      "date",
      true
    );

    // Create sessions for all enrollments without checking meeting availability
    const newSessions = await addSessionsServer(
      weekStart,
      weekEnd,
      enrollments,
      sessions
    );
    if (!newSessions) {
      throw new Error("No sessions were created");
    }
    return newSessions;
  } catch (error: any) {
    console.error("Failed to add sessions:", error);
    throw error;
  }
};
