import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/types";
import { Profile } from "@/types";
import { createClient } from "@supabase/supabase-js";
import { addMinutes, subMinutes, parseISO } from "date-fns";
import { scheduleEmail } from "@/lib/actions/email.server.actions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    ) {
      throw new Error("Missing Supabase environment variables");
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const data = await request.json();
    const session: Session = data.session;
    const tutor: Profile | null = session.tutor;
    const student: Profile | null = session.student;

    if (!tutor || !student) {
      throw new Error("No identified tutor or student");
    }

    //* Uncomment in production
    const sessionDate = parseISO(session.date);
    // const sessionDate = new Date();

    const scheduledTime = subMinutes(sessionDate, 15);

    console.log("Scheduled date", scheduledTime);

    const tutorName: string = tutor
      ? ` ${tutor.firstName} ${tutor.lastName}`
      : "";
    const studentName: string = student
      ? `${student.firstName} ${student.lastName}`
      : "your student";

    const message = `Hi${tutorName}, your tutoring session with ${studentName} starts soon in 15 minutes!`;
    console.log("Message", message);

    const result = await scheduleEmail({
      notBefore: Math.floor(scheduledTime.getTime() / 1000),
      to: tutor.email,
      subject: "Upcoming Connect Me Session",
      body: message,
      sessionId: session.id,
    });

    if (result && result.messageId) {
      console.log("Qstash publish successful", result);

      const { data, error } = await supabase
        .from("Emails")
        .insert({
          recipient_id: tutor?.id ?? null,
          session_id: session.id,
          message_id: result.messageId,
          description: "Session Reminder",
        })
        .select();

      if (error) {
        console.error("Supabase insert error", error);
        throw error;
      }
      if (!data) {
        throw new Error("Unable to record scheduled message");
      }
    }

    return NextResponse.json({
      status: 200,
      message: "Email reminder scheduled successfully",
      messageId: result.messageId,
    });
  } catch (error) {
    console.error("Error scheduling reminder", error);
    return NextResponse.json({
      status: 500,
      message: "Unable to reschedule email",
    });
  }
}
