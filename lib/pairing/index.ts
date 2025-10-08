import { PairingMatch } from "@/types/pairing";
import { createClient } from "../supabase/server";
import { Table } from "../supabase/tables";
import { Person } from "@/types/enrollment";
import { PairingLogSchemaType } from "./types";
import PairingRequestNotificationEmail, {
  PairingRequestNotificationEmailProps,
} from "@/components/emails/pairing-request-notification";
import { getProfile, getProfileWithProfileId } from "../actions/user.actions";
import {
  sendPairingRequestEmail,
} from "../actions/email.server.actions";
import { Profile } from "@/types";

type QueueItem = {
  pairing_request_id: string;
  profile_id: string;
};

type PairingRequests = {};

type QueueItemMatch = QueueItem & {
  similarity: number;
  match_profile: Person;
  requestor_profile: Person;
};

const sendPairingRequestNotification = async (
  tutorId: string,
  studentId: string
) => {
  const tutorData: Profile | null = await getProfileWithProfileId(tutorId);

  const studentData: Profile | null = await getProfileWithProfileId(studentId);

  console.log("Sending pairing request notification");

  if (tutorData && studentData) {
    const emailData: PairingRequestNotificationEmailProps = {
      tutor: tutorData,
      student: studentData,
    };
    return sendPairingRequestEmail(emailData, tutorData.email);
  }
};

export const runPairingWorkflow = async () => {
  // console.log("STARTING PAIRING WORKFLOW");
  const supabase = createClient();

  const updatePairingStatus = (requestId: string, status: "paired") =>
    supabase.from("pairing_requests").update({ status }).eq("id", requestId);

  const logs: PairingLogSchemaType[] = [];

  // Get top pairing requests for tutors & students
  const [tutorQueueResult, studentQueueResult] = await Promise.all([
    supabase.rpc("get_top_pairing_request", { request_type: "tutor" }),
    supabase.rpc("get_top_pairing_request", { request_type: "student" }),
  ]);

  const [tutorQueue, studentQueue] = [
    tutorQueueResult.data ?? [],
    studentQueueResult.data ?? [],
  ] as [QueueItem[], QueueItem[]];

  console.log(tutorQueue.length);
  console.log(studentQueue.length);

  // console.log("tutorQueue:", tutorQueue);
  // console.log("studentQueue:", studentQueue);

  // Helper to shuffle a queue

  // Alternate pairing: student, tutor, student, tutor
  const maxLength = Math.max(studentQueue.length, tutorQueue.length);

  const studentMatches: QueueItemMatch[] = [];
  const tutorMatches: QueueItemMatch[] = [];

  // Track tutor request IDs that should be updated *after* all matches
  const tutorsToUpdate: string[] = [];

  for (let i = 0; i < maxLength; i++) {
    // Handle students first (student → tutor)
    if (i < studentQueue.length) {
      console.log("Student Queue");
      const studentReq = studentQueue[i];
      const { data, error } = await supabase
        .rpc("get_best_match", {
          request_type: "student",
          request_id: studentReq.pairing_request_id,
        })
        .single();

      const result = data as QueueItemMatch;
      if (error) console.error("Student best_match error:", error);

      if (result) {
        const { requestor_profile, match_profile } = result;
        logs.push({
          message: `${requestor_profile.first_name} ${requestor_profile.last_name} matched with ${match_profile?.first_name} ${match_profile?.last_name}`,
          type: "pairing-match",
          error: false,
          metadata: {
            pairing_request_id: studentReq.pairing_request_id,
            match_profile_id: result.match_profile.id,
          },
        });
        console.log("Running student pairing");
        await updatePairingStatus(studentReq.pairing_request_id, "paired");

        studentMatches.push(result);

        // ✅ Immediately mark student as paired
        await updatePairingStatus(studentReq.pairing_request_id, "paired");

        studentMatches.push(result);
      } else {
        logs.push({
          message: "Failed to find pairing for student",
          type: "pairing-selection-failed",
          error: true,
          metadata: {
            pairing_request_id: studentReq.pairing_request_id,
          },
        });
      }
    }

    // Handle tutors (tutor → student)
    if (i < tutorQueue.length) {
      console.log("Tutor Queue");
      const tutorReq = tutorQueue[i];
      const { data, error } = await supabase
        .rpc("get_best_match", {
          request_type: "tutor",
          request_id: tutorReq.pairing_request_id,
        })
        .single();

      const result = data as QueueItemMatch;
      // console.log("Tutor match:", data);
      if (error) console.error("Tutor best_match error:", error);

      if (result as QueueItemMatch) {
        await updatePairingStatus(tutorReq.pairing_request_id, "paired");
        await sendPairingRequestNotification(
          result.requestor_profile.id,
          result.match_profile.id
        );

        tutorMatches.push(result as QueueItemMatch);
        tutorsToUpdate.push(tutorReq.pairing_request_id);
        logs.push({
          message: `Tutor ${result.requestor_profile.first_name} matched with ${result.match_profile.first_name}`,
          type: "pairing-match",
          error: false,
          metadata: {
            pairing_request_id: tutorReq.pairing_request_id,
            match_profile_id: result.match_profile.id,
          },
        });
      } else {
        logs.push({
          message: "Failed to find pairing for tutor",
          type: "pairing-selection-failed",
          error: true,
          metadata: {
            pairing_request_id: tutorReq.pairing_request_id,
          },
        });
      }
    }
  }

  // Build matches for DB insert
  const matchedStudents: PairingMatch[] = studentMatches.map(
    (match) =>
      ({
        student_id: match.requestor_profile.id,
        tutor_id: match.match_profile.id,
        similarity: match.similarity,
      }) as PairingMatch
  );

  const matchedTutors: PairingMatch[] = tutorMatches.map(
    (match) =>
      ({
        student_id: match.match_profile.id,
        tutor_id: match.requestor_profile.id,
        similarity: match.similarity,
      }) as PairingMatch
  );

  console.log(matchedStudents);

  try {
    const emailPromises = matchedStudents.map(async (match) => {
      try {
        return await sendPairingRequestNotification(
          match.tutor_id,
          match.student_id
        );
      } catch (error) {
        throw error;
      }
    });
    const results = await Promise.allSettled(emailPromises);
    results.forEach((result, index) => {
      if (result.status === "rejected") {
        console.error(`Failed to send match email${index}:`, result.reason);
      }
    });
  } catch (error) {
    console.error("Error processing matches", error);
  }

  // console.log(matchedTutors, matchedStudents);

  const r1 = await supabase
    .from("pairing_matches")
    .insert(
      [...matchedStudents, ...matchedTutors].filter(
        ({ similarity }) => similarity
      )
    );

  // Insert logs
  const r2 = await supabase
    .from("pairing_logs")
    .insert(logs.filter((log) => !log.error));

  // ✅ Now mark tutors as paired (after all matching is done)
  if (tutorsToUpdate.length > 0) {
    await supabase
      .from("pairing_requests")
      .update({ status: "paired" })
      .in("id", tutorsToUpdate);
  }

  console.log("Pairing complete:", { matches: r1, logs: r2 });
};
