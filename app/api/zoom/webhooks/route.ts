import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { config } from "@/config";
import {
  logZoomMetadata,
  updateParticipantLeaveTime,
} from "@/lib/actions/zoom.server.actions";

const MEETING_ID_TO_SECRET: Record<string, string> = {
  "89d13433-04c3-48d6-9e94-f02103336554": config.zoom.ZOOM_LINK_A_WH_SECRET,
  "72a87729-ae87-468c-9444-5ff9b073f691": config.zoom.ZOOM_LINK_B_WH_SECRET,
  "26576a69-afe8-46c3-bc15-dec992989cdf": config.zoom.ZOOM_LINK_C_WH_SECRET,
  "83cd43b6-ca22-411c-a75b-4fb9c685295b": config.zoom.ZOOM_LINK_D_WH_SECRET,
  "8d61e044-135c-4ef6-83e8-9df30dc152f2": config.zoom.ZOOM_LINK_E_WH_SECRET,
  "fc4f7e3a-bb0f-4fc4-9f78-01ca022caf33": config.zoom.ZOOM_LINK_F_WH_SECRET,
  "132360dc-cad9-4d4c-88f8-3347585dfcf1": config.zoom.ZOOM_LINK_G_WH_SECRET,
  "f87f8d74-6dc4-4a6c-89b7-717df776715f": config.zoom.ZOOM_LINK_H_WH_SECRET,
  "c8e6fe57-59e5-4bbf-8648-ed6cac2df1ea": config.zoom.ZOOM_LINK_I_WH_SECRET,
};

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

  // Find the validation secret using the meeting UUID from the payload
  const validationSecret = zoomMeetingId
    ? MEETING_ID_TO_SECRET[zoomMeetingId]
    : null;

  if (!validationSecret) {
    console.error("⚠️ No secret found for meeting ID:", zoomMeetingId);
    // Log all available identifiers for debugging
    console.error("Available payload keys:", Object.keys(payload || {}));
    console.error(
      "Full payload object:",
      JSON.stringify(payload?.object || {}, null, 2)
    );

    // For URL validation, we still need to respond even without secret
    if (body.event === "endpoint.url_validation") {
      return NextResponse.json(
        {
          error: `No webhook secret configured for meeting: ${zoomMeetingId}`,
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      {
        error: `No webhook secret configured for meeting: ${zoomMeetingId}`,
        accountId,
        meetingNumber,
      },
      { status: 401 }
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

  // Verify authorization header from Zoom
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${validationSecret}`) {
    console.error("❌ Authorization failed", {
      expected: `Bearer ${validationSecret.substring(0, 10)}...`,
      received: authHeader ? `${authHeader.substring(0, 20)}...` : "none",
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
            user_name: participant?.user_name || "Unknown",
            participant_uuid:
              participant?.user_id || participant?.participant_user_id || "",
            email: participant?.email || null,
            date_time: participant?.join_time || new Date().toISOString(),
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

          const result = await updateParticipantLeaveTime(
            zoomMeetingId,
            participantUuid,
            leaveTime,
            leaveReason
          );

          if (result && result.length > 0) {
            console.log(
              `✅ Updated leave time for ${participant?.user_name} in meeting ${zoomMeetingId} (account: ${accountId})`
            );
          } else {
            // If no record was updated, the participant might not have a join record
            // Log this as a warning and optionally insert a record
            console.warn(
              `⚠️ No join record found to update for participant ${participant?.user_name}. Inserting new record.`
            );

            // Insert a record with both join and leave times if needed
            await logZoomMetadata({
              session_id: zoomMeetingId,
              user_name: participant?.user_name || "Unknown",
              participant_uuid: participantUuid,
              email: participant?.email || null,
              date_time: participant?.join_time || leaveTime, // Use join_time if available, otherwise leave_time
              leave_time: leaveTime,
              leave_reason: leaveReason,
            });
          }
        } catch (error) {
          console.error("Error updating participant leave:", error);
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
