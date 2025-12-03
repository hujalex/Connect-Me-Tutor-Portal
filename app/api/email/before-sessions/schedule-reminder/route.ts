import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/types";
import { Profile } from "@/types";
import { createClient } from "@/lib/supabase/server"
import { addMinutes, subMinutes, parseISO } from "date-fns";
import { scheduleEmail } from "@/lib/actions/email.server.actions";
import { getSupabase } from "@/lib/supabase-server/serverClient";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();

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

    const message = createMessage(session, tutor, student);

    const result = await scheduleEmail({
      notBefore: Math.floor(scheduledTime.getTime() / 1000),
      to: tutor.email,
      subject: "Upcoming Connect Me Session",
      body: message,
      sessionId: session.id,
    });

    if (result && result.messageId) {
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

/**
 * TODO: Provide more details regarding upcoming tutoring sessions
 * @param session Session Details
 * @param tutor Details about the tutor
 * @param student Details about the student
 * 
 * 
 * @returns email notification message
 */

const createMessage = (session: Session, tutor: Profile, student: Profile) => {
   const tutorName: string = tutor
      ? ` ${tutor.firstName} ${tutor.lastName}`
      : "";
    const studentName: string = student
      ? `${student.firstName} ${student.lastName}`
      : "your student";

  return `Hi ${tutorName}, reminder that your tutoring session with ${studentName} starts soon in 15 minutes!
          Remember to visit https://www.connectmego.app/ and fill in a Session Exist Form (SEF) once the 
          session is complete.
          
          Here's the Zoom link to the meeting: ${session.meeting?.link}
          
          If you are planning to cancel, reschedule, or add additional session, everything can be done through
          the portal (https://www.connectmego.app/). 
          
          For additional information, please first reference the ConnectMe Guidebook 
          (https://drive.google.com/file/d/1vk9neT5FzDfk2ICpW6aeP5B_OL06te8i/view)
          
          Otherwise don't hesitate to shoot us a message on Discord!
          
          Best, 
          The ConnectMe Team`;
}
