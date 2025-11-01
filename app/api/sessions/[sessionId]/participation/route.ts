import { NextRequest, NextResponse } from "next/server";
import { getParticipationBySessionId } from "@/lib/actions/zoom.server.actions";
import { getSessionById } from "@/lib/actions/session.server.actions";

export async function GET(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  try {
    const sessionId = params.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID is required" },
        { status: 400 }
      );
    }

    // Get session details to calculate meeting end time
    const session = await getSessionById(sessionId);

    if (!session) {
      return NextResponse.json({ error: "Session not found" }, { status: 404 });
    }

    // Get participation records
    const participationRecords = await getParticipationBySessionId(sessionId);

    if (!participationRecords) {
      return NextResponse.json(
        { error: "Failed to fetch participation data" },
        { status: 500 }
      );
    }

    // Transform participation records into events format
    const events = participationRecords.flatMap((record) => {
      const events: Array<{
        id: string;
        participantId: string;
        name: string;
        email: string;
        action: "joined" | "left";
        timestamp: string;
      }> = [];

      // Add join event
      events.push({
        id: `${record.id}-join`,
        participantId: record.participant_uuid,
        name: record.user_name,
        email: record.email || "",
        action: "joined",
        timestamp: record.date_time,
      });

      // Add leave event if exists
      if (record.leave_time) {
        events.push({
          id: `${record.id}-leave`,
          participantId: record.participant_uuid,
          name: record.user_name,
          email: record.email || "",
          action: "left",
          timestamp: record.leave_time,
        });
      }

      return events;
    });

    // Sort events by timestamp
    events.sort(
      (a, b) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    // Calculate participant summaries
    const participantMap = new Map<
      string,
      {
        id: string;
        name: string;
        email: string;
        totalDuration: number;
        joinCount: number;
        currentlyInMeeting: boolean;
        firstJoined: string;
        lastActivity: string;
      }
    >();

    const sessionStartTime = session.date ? new Date(session.date) : new Date();
    const sessionEndTime = session.duration
      ? new Date(sessionStartTime.getTime() + session.duration * 60 * 1000)
      : null;

    events.forEach((event) => {
      if (!participantMap.has(event.participantId)) {
        participantMap.set(event.participantId, {
          id: event.participantId,
          name: event.name,
          email: event.email,
          totalDuration: 0,
          joinCount: 0,
          currentlyInMeeting: false,
          firstJoined: event.timestamp,
          lastActivity: event.timestamp,
        });
      }

      const summary = participantMap.get(event.participantId)!;
      summary.lastActivity = event.timestamp;

      if (event.action === "joined") {
        summary.joinCount++;
        summary.currentlyInMeeting = true;
      } else {
        summary.currentlyInMeeting = false;
      }
    });

    // Calculate durations for each participant
    participantMap.forEach((summary) => {
      const userEvents = events.filter((e) => e.participantId === summary.id);
      let totalDuration = 0;
      let joinTime: Date | null = null;

      userEvents.forEach((event) => {
        if (event.action === "joined") {
          joinTime = new Date(event.timestamp);
        } else if (event.action === "left" && joinTime) {
          const leaveTime = new Date(event.timestamp);
          totalDuration +=
            (leaveTime.getTime() - joinTime.getTime()) / (1000 * 60);
          joinTime = null;
        }
      });

      // If still in meeting, calculate duration until session end or now
      if (joinTime && summary.currentlyInMeeting) {
        const endTime = sessionEndTime || new Date();
        totalDuration += (endTime.getTime() - joinTime.getTime()) / (1000 * 60);
      }

      summary.totalDuration = Math.round(totalDuration);
    });

    const participantSummaries = Array.from(participantMap.values()).sort(
      (a, b) => b.totalDuration - a.totalDuration
    );

    return NextResponse.json({
      session: {
        id: session.id,
        meetingTitle: session.meeting?.name || "Tutoring Session",
        meetingId: session.meeting?.meetingId || "",
        startTime: session.date,
        endTime: sessionEndTime?.toISOString() || null,
        totalDuration: session.duration || 0,
      },
      events,
      participantSummaries,
    });
  } catch (error) {
    console.error("Error fetching participation data:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
