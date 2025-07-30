import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { deleteMsg } from "@/lib/actions/email.server.actions";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  try {
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      !process.env.SUPABASE_SERVICE_ROLE_KEY
    ) {
      throw new Error("Invalid Credentials");
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    const data = await request.json();
    const sessionId = data.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        {
          message: "SessionId is required",
        },
        { status: 400 }
      );
    }

    const { data: emailData, error: fetchError } = await supabase
      .from("Emails")
      .select("id, message_id")
      .eq("session_id", sessionId)
      .single();

    if (fetchError) {
      if (fetchError.code === "PGRST116") {
        return NextResponse.json(
          {
            message: "No scheduled email found",
          },
          {
            status: 200,
          }
        );
      }
      console.error("Error fetching messageId", fetchError);
      throw fetchError;
    }

    if (!emailData || !emailData.message_id) {
      console.error("No Scheduled Email found");
      return NextResponse.json(
        { message: "Scheduled email found but no message_id" },
        { status: 404 }
      );
    }


    await deleteMsg(emailData.message_id);

    const { error: deleteDbError } = await supabase
      .from("Emails")
      .delete()
      .eq("id", emailData.id);

    if (deleteDbError) {
      console.error(
        "Error deleting email record from Supabase:",
        deleteDbError
      );
      throw deleteDbError; // Let the generic catch handle it
    }

    return NextResponse.json({
      status: 200,
      message: "Email reminder scheduled successfully",
    });
  } catch (error) {
    console.error("Error deleting scheduled reminder");
    return NextResponse.json({
      status: 500,
      message: "Unable to delete reminder",
    });
  }
}
