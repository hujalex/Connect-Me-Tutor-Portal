import { getProfileByEmail } from "@/lib/actions/user.actions";
import { Profile } from "@/types";
import { SupabaseAuthClient } from "@supabase/supabase-js/dist/module/lib/SupabaseAuthClient";
import { request } from "http";
import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";
import { ideahub } from "googleapis/build/src/apis/ideahub";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

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

    const { to, subject, body } = await request.json();

    const recipient: Profile = await getProfileByEmail(to);
    const { data: notification_settings, error } = await supabase
      .from("User_Notification_Settings")
      .select("email_tutoring_session_notifications_enabled")
      .eq("id", recipient.settingsId)
      .single();

    if (error) throw error;
    if (!notification_settings) throw new Error("No Notification Settings");

    if (notification_settings.email_tutoring_session_notifications_enabled) {
      await resend.emails.send({
        from: "ConnectMe@connectmego.app",
        to: to,
        subject: subject,
        text: body,
      });
      console.log("Successfully sent email");
      return NextResponse.json({
        status: 200,
        message: "Email sent successfully",
      });
    }
    console.log("Email Setting turned off");
    return NextResponse.json({
      status: 200,
      message: "Email setting turned off",
    });
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({
      status: 500,
      message: "Unable to send email or fetch email settings",
    });
  }
}
