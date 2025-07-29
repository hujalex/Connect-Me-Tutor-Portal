import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";

const ZOOM_VERIFICATION_TOKEN = "mzW4sg6xRBScX_j8xdA7pA";
export async function POST(req: NextRequest) {
  console.log("Received Zoom webhook request");
  const body = await req.json();

  console.log("Request body:", body);

  // ✅ 1. Handle Zoom's URL validation challenge
  if (body.event === "endpoint.url_validation") {
    const hashForValidate = crypto
      .createHmac("sha256", ZOOM_VERIFICATION_TOKEN)
      .update(body.payload.plainToken)
      .digest("hex");

    return NextResponse.json({
      plainToken: body.payload.plainToken,
      encryptedToken: hashForValidate,
    });
  }
  // ✅ 2. Verify authorization header from Zoom
  const authHeader = req.headers.get("authorization");
  console.log(authHeader);
  if (authHeader !== `Bearer ${ZOOM_VERIFICATION_TOKEN}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  console.log("Authorization header verified");

  // ✅ 3. Handle actual Zoom events
  const event = body?.event;
  const payload = body?.payload;

  switch (event) {
    case "meeting.started":
      console.log("Meeting started:", payload?.object?.id);
      break;

    case "meeting.participant_joined":
      console.log(
        "Participant joined:",
        payload?.object?.participant?.user_name
      );
      break;

    default:
      console.log("Unhandled Zoom event:", event);
  }

  return NextResponse.json({ status: "received" });
}
