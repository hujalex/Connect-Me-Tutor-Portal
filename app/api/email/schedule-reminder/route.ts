import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/types";
import { Profile } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Client } from "@upstash/qstash";
import { addMinutes } from "date-fns";
import { Result } from "postcss";

export const dynamic = "force-dynamic";

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const sessionTime: Date = data.sessionTime;

    const scheduledTime = addMinutes(sessionTime, 2);

    if (process.env.NODE_ENV === "development") {
      // Make direct call to your email API
      const emailResponse = await fetch(
        `${process.env.NEXT_PUBLIC_LOCAL_URL || "http://localhost:3000"}/api/email/send-email`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            to: "ahuwindsor@gmail.com",
            subject: "Reminder (Direct - Development)",
            body: "Your tutoring session starts soon! (Sent directly in development)",
          }),
        }
      );

      if (!emailResponse.ok) {
        throw new Error(
          `Failed to send email directly: ${emailResponse.statusText}`
        );
      }

      return NextResponse.json({
        status: 200,
        message: "Email sent directly (development mode)",
      });
    }

    const result = await qstash.publishJSON({
      url: `${process.env.NEXT_PUBLIC_LOCAL_URL || "https://connectmego.app"}/api/email/send-email`,
      notBefore: Math.floor(scheduledTime.getTime() / 1000),
      body: {
        to: "ahuwindsor@gmail.com",
        subject: "Reminder",
        body: "Your tutoring session starts soon!",
      },
    });
    console.log(`${process.env.NEXT_PUBLIC_LOCAL_URL}`);
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
