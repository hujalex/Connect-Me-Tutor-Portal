import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { config } from "@/config";
import {
  logZoomMetadata,
  updateParticipantLeaveTime,
} from "@/lib/actions/zoom.server.actions";

// Use a single signing secret for all Zoom webhooks
const validationSecret = config.zoom.ZOOM_WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  console.log("Received Zoom webhook request");
  const body = await req.json();

  const payload = body?.payload;
  const event = body?.event;

  // Extract identifying information from the payload
  const zoomMeetingId = payload?.object?.id; // Meeting UUID (primary identifier)
  const accountId = payload?.account_id; // Account ID
  const accountEmail = payload?.account_email; // Account email
  const meetingNumber = payload?.object?.meeting_number; // Zoom meeting number
  const hostId = payload?.object?.host_id; // Host user ID

  console.log("Webhook identifiers:", {
    zoomMeetingId,
    accountId,
    accountEmail,
    meetingNumber,
    hostId,
    event,
  });

  if (!validationSecret) {
    console.error("⚠️ Zoom webhook secret not configured");
    return NextResponse.json(
      {
        error: "Webhook secret not configured",
      },
      { status: 500 }
    );
  }

  // Handle Zoom's URL validation challenge
  if (body.event === "endpoint.url_validation") {
    console.log("Validating webhook URL for meeting:", zoomMeetingId);
    const hashForValidate = crypto
      .createHmac("sha256", validationSecret)
      .update(body.payload.plainToken)
      .digest("hex");

    return NextResponse.json({
      plainToken: body.payload.plainToken,
      encryptedToken: hashForValidate,
    });
  }

  // Verify authorization from Zoom
  // Zoom may send the token with or without "Bearer " prefix
  const authHeader = req.headers.get("authorization");
  const signature = req.headers.get("x-zm-signature");
  const timestamp = req.headers.get("x-zm-request-timestamp");
  
  let isAuthorized = false;
  
  //Check Authorization header (flexible format)
  if (authHeader) {
    // Remove "Bearer " prefix if present and compare
    const authToken = authHeader.replace(/^Bearer\s+/i, "").trim();
    // Check if it matches the secret (with or without Bearer prefix)
    if (authToken === validationSecret || authHeader === `Bearer ${validationSecret}`) {
      isAuthorized = true;
    }
  }
  
  // Method 2: Verify HMAC signature (recommended by Zoom, more secure)
  if (!isAuthorized && signature && timestamp) {
    try {
      const bodyString = JSON.stringify(body);
      const message = `v0:${timestamp}:${bodyString}`;
      const expectedSignature = `v0=${crypto
        .createHmac("sha256", validationSecret)
        .update(message)
        .digest("hex")}`;
      
      if (signature === expectedSignature) {
        isAuthorized = true;
      }
    } catch (error) {
      console.error("Error verifying HMAC signature:", error);
    }
  }
  
  if (!isAuthorized) {
    console.error("❌ Authorization failed", {
      expected: validationSecret.substring(0, 10) + "...",
      receivedAuth: authHeader ? `${authHeader.replace(/^Bearer\s+/i, "").trim().substring(0, 20)}...` : "none",
      receivedSignature: signature ? `${signature.substring(0, 20)}...` : "none",
      hasTimestamp: !!timestamp,
      zoomMeetingId,
      accountId,
    });
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("✅ Authorization verified for:", {
    meeting: zoomMeetingId,
    account: accountId,
    event,
  });

  // Handle actual Zoom events
  switch (event) {
    case "meeting.started":
      console.log("Meeting started:", {
        meetingId: zoomMeetingId,
        accountId,
        meetingNumber,
        startTime: payload?.object?.start_time,
      });
      break;

    case "meeting.participant_joined":
      {
        const participant = payload?.object?.participant;
        console.log("JOINED:", {
          meetingId: zoomMeetingId,
          accountId,
          participantName: participant?.user_name,
          participantEmail: participant?.email,
          participantId: participant?.user_id,
        });

        try {
          await logZoomMetadata({
            session_id: zoomMeetingId,
            participant_id:
              participant?.user_id || participant?.participant_user_id || "",
            name: participant?.user_name || "Unknown",
            email: participant?.email || null,
            action: "joined",
            timestamp: participant?.join_time || new Date().toISOString(),
          });
          console.log(
            `✅ Logged join for ${participant?.user_name} in meeting ${zoomMeetingId} (account: ${accountId})`
          );
        } catch (error) {
          console.error("Error logging participant join:", error);
        }
      }
      break;

    case "meeting.participant_left":
      {
        const participant = payload?.object?.participant;
        const leaveTime = participant?.leave_time || new Date().toISOString();
        const leaveReason = participant?.leave_reason || undefined;
        const participantUuid =
          participant?.user_id || participant?.participant_user_id;

        console.log("Participant left:", {
          meetingId: zoomMeetingId,
          accountId,
          participantName: participant?.user_name,
          participantUuid,
          leaveTime,
          leaveReason,
        });

        try {
          if (!participantUuid) {
            console.warn("⚠️ No participant UUID found in leave event");
            break;
          }

          await updateParticipantLeaveTime(
            zoomMeetingId,
            participantUuid,
            participant?.user_name || "Unknown",
            participant?.email || null,
            leaveTime
          );

          console.log(
            `✅ Logged leave event for ${participant?.user_name} in meeting ${zoomMeetingId} (account: ${accountId})`
          );
        } catch (error) {
          console.error("Error logging participant leave:", error);
        }
      }
      break;

    case "meeting.ended":
      console.log("Meeting ended:", {
        meetingId: zoomMeetingId,
        accountId,
        endTime: payload?.object?.end_time,
      });
      break;

    default:
      console.log("Unhandled Zoom event:", event, {
        meetingId: zoomMeetingId,
        accountId,
      });
  }

  return NextResponse.json({
    status: "received",
    meetingId: zoomMeetingId,
    accountId,
  });
}
