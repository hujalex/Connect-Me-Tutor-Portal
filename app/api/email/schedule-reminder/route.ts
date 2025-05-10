import { NextRequest, NextResponse } from "next/server";
import { Session } from "@/types";
import { Profile } from "@/types";
import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { Client } from "@upstash/qstash";
import { addMinutes } from "date-fns";

export const dynamic = "force-dynamic";

const qstash = new Client({ token: process.env.QSTASH_TOKEN });

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const sessionTime: Date = data.sessionTime;

    const scheduledTime = addMinutes(sessionTime, 1);

    await qstash.publishJSON({
      url: `/api/email/send-email`,
      notBefore: Math.floor(scheduledTime.getTime() / 1000),
      body: {
        to: "ahuwindsor@gmail.com",
        subject: "Reminder",
        body: "Your tutoring session starts soon!",
      },
    });
  } catch (error) {}
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
