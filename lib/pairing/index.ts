"use server"
import { PairingMatch } from "@/types/pairing";
import { createClient } from "../supabase/server";
import { Table } from "../supabase/tables";
import { Person } from "@/types/enrollment";
import { PairingLogSchemaType } from "./types";
import PairingRequestNotificationEmail from "@/components/emails/pairing-request-notification";
import { PairingConfirmationEmailProps, PairingRequestNotificationEmailProps } from "@/types/email";
import { getProfile, getProfileWithProfileId } from "../actions/user.actions";
import {
  sendPairingRequestEmail,
} from "../actions/email.server.actions";
import { Profile } from "@/types";
import { getSupabase } from "../supabase-server/serverClient";

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


  if (tutorData && studentData) {
    const emailData: PairingRequestNotificationEmailProps = {
      tutor: tutorData,
      student: studentData,
    };
    return sendPairingRequestEmail(emailData, tutorData.email);
  }
};

const updatePairingStatus = (supabase: any, requestId: string, status: "paired") => {
    supabase.from("pairing_requests").update({ status }).eq("id", requestId);
}

const buildMatches = async (matches: QueueItemMatch[]): Promise<PairingMatch[]> => {
  return matches.map((match) => ({
    student_id: match.requestor_profile.id,
    tutor_id: match.match_profile.id,
    similarity: match.similarity,
  }) as PairingMatch)
}

export const runPairingWorkflow = async () => {
  const logs: PairingLogSchemaType[] = [];

  const supabase = createClient();

  // Get top pairing requests for tutors & students
  const [tutorQueueResult, studentQueueResult] = await Promise.all([
    supabase.rpc("get_top_pairing_request", { request_type: "tutor" }),
    supabase.rpc("get_top_pairing_request", { request_type: "student" }),
  ]);

  const [tutorQueue, studentQueue] = [
    tutorQueueResult.data ?? [],
    studentQueueResult.data ?? [],
  ] as [QueueItem[], QueueItem[]];


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
        await updatePairingStatus(supabase, studentReq.pairing_request_id, "paired");

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
        await updatePairingStatus(supabase, tutorReq.pairing_request_id, "paired");
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
  const matchedStudents: PairingMatch[] = await buildMatches(studentMatches)
  const matchedTutors: PairingMatch[] = await buildMatches(tutorMatches)


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

  const {data: r1, error: r1Error} = await supabase
    .from("pairing_matches")
    .insert(
      [...matchedStudents, ...matchedTutors].filter(
        ({ similarity }) => similarity
      )
    );

  // dummy insert
  if (r1Error) throw r1Error


  const student_id = 'aa21a1c4-c57b-42b7-97ba-084bc0a480a0'
  const tutor_id = 'f546b169-8ac1-41b3-bbad-5717e44e2564'

  // const {data: dummyData, error: dummyError} = await supabase.from("pairing_matches").insert(
  //   {student_id: student_id,
  //     tutor_id: tutor_id,
  //     similarity: 0.8,
  //   }
  // )

  // if (dummyError) {
  //   console.error("FAILED DUMMY TEST", dummyError)
  //   throw dummyError
  // }


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
