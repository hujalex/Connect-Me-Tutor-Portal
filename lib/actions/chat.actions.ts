// lib/admins.actions.ts

// lib/student.actions.ts
import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import {
  Profile,
  Session,
  Notification,
  Event,
  Enrollment,
  Meeting,
} from "@/types";
import {
  deleteScheduledEmailBeforeSessions,
  sendScheduledEmailsBeforeSessions,
  updateScheduledEmailBeforeSessions,
} from "./email.server.actions";
import { getProfileWithProfileId, getProfileByEmail } from "./user.actions";
import {
  addDays,
  format,
  parse,
  parseISO,
  isBefore,
  isAfter,
  areIntervalsOverlapping,
  addHours,
  isValid,
  setHours,
  setMinutes,
} from "date-fns"; // Only use date-fns
import { toZonedTime, fromZonedTime } from "date-fns-tz";
import ResetPassword from "@/app/(public)/set-password/page";
import { getStudentSessions } from "./student.actions";
import { date } from "zod";
import { withCoalescedInvoke } from "next/dist/lib/coalesced-function";
import toast from "react-hot-toast";
import { DatabaseIcon } from "lucide-react";
import { SYSTEM_ENTRYPOINTS } from "next/dist/shared/lib/constants";
import { Table } from "../supabase/tables";
// import { getMeeting } from "./meeting.actions";

const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export async function fetchAdmins() {
  try {
    const { data, error } = await supabase
      .from("Profiles")
      .select("*")
      .eq("role", "Admin");
    if (error) throw error;
    console.log(data);
    return data;
  } catch (error) {
    console.error("unable to fetch admin information");
  }
}
