import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/types";
import { Profile } from "@/types";
import { createClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Client } from "@upstash/qstash";
import { addMinutes, parseISO } from "date-fns";
import { Result } from "postcss";
import { formatSessionDate } from "@/lib/utils";
import { schedulePreSessionEmail } from "@/lib/email-scheduler";
import { getProfileWithProfileId } from "@/lib/actions/user.actions";
import { scheduleEmail } from "@/lib/actions/qstash.actions";

export const dynamic = "force-dynamic";

// const qstash = new Client({ token: process.env.QSTASH_TOKEN });

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

    console.log("Data", data);

    const session: Session = data.session;

    console.log("Scheduled session", session);

    const tutor: Profile | null = session.tutor;

    const student: Profile | null = session.student;

    //* Uncomment in production
    // const sessionDate = parseISO(session.date);
    const sessionDate = new Date();

    const scheduledTime = addMinutes(sessionDate, 10);

    console.log("Scheduled date", scheduledTime);

    const tutorName: string = tutor
      ? ` ${tutor.firstName} ${tutor.lastName}`
      : "";
    const studentName: string = student
      ? `${student.firstName} ${student.lastName}`
      : "your student";

    const message = `Hi${tutorName} your tutoring session with ${studentName} starts soon!`;
    console.log("Message", message);

    const result = await scheduleEmail({
      notBefore: Math.floor(scheduledTime.getTime() / 1000),
      to: "ahuwindsor@gmail.com",
      subject: "Upcoming Connect Me Session",
      body: message,
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

    // console.log(`${process.env.NEXT_PUBLIC_API_URL}`);
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

// export async function POST(request: NextRequest, response: NextResponse) {
//   try {
//     const { user, sessionData } = await request.json();
//     if (!user || !sessionData) {
//       return NextResponse.json({
//         error: "Missing User or Session Details",
//         status: 400,
//       });
//     }

//     const supabase = createClient();
//     const { data, error } = await supabase
//       .from("Profiles")
//       .select("*")
//       .eq("id", user.id);

//     if (error) {
//       console.error("Error fetching user data:", error);
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }
//     if (!data || data.length === 0) {
//       return NextResponse.json({ error: "User not found" }, { status: 404 });
//     }

//   } catch (error) {}
// }
