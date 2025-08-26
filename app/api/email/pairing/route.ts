import TutorMatchingNotificationEmail from "@/components/emails/tutor-matching-notification";
import { render } from "@react-email/components";
import { NextResponse, type NextRequest } from "next/server";
import React from "react";
import { Resend } from "resend";

const allowedEmailTypes: string[] = ["match-accepted"] as const;

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(req: NextRequest) {
  try {
    const { emailType, data } = await req.json();

    if (!emailType || !allowedEmailTypes.includes(emailType))
      return NextResponse.json({ error: "must provide valid email type" });

    if (emailType === "match-accepted") {
      console.log("rendering with", data);
      const emailHtml = await render(
        React.createElement(TutorMatchingNotificationEmail, data)
      ); // ✅ no JSX
      console.log("email temp: ", emailHtml);
      const emailResult = await resend.emails.send({
        from: "reminder@connectmego.app",
        to: "aaronmarsh755@gmail.com",
        subject: "Connect Me Email",
        html: emailHtml,
      });

      console.log("email result:", emailResult);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error(err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
