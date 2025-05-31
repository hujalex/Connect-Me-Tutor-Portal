import { request } from "http";
import { NextRequest, NextResponse } from "next/server";
import { Resend } from "resend";

export const dynamic = "force-dynamic";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: NextRequest) {
  try {
    const { to, subject, body } = await request.json();

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
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ status: 500, message: "Unable to send email" });
  }
}
