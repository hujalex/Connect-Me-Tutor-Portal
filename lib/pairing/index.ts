import { PairingLog } from "@/types/pairing";
import { createClient } from "../supabase/server";
import { Table } from "../supabase/tables";

type QueueItem = {
  pairing_request_id: string;
  profile_id: string;
};

type QueueItemMatch = QueueItem & { similarity: string };

export const runPairingWorkflow = async () => {
  const supabase = createClient();

  const updatePairingStatus = (requestId: string, status: "paired") =>
    supabase.from("pairing_requests").update({ status }).eq("id", requestId);

  const logs: PairingLog[] = [];

  // Get top pairing requests for tutors & students
  const [tutorQueueResult, studentQueueResult] = await Promise.all([
    supabase.rpc("get_top_pairing_request", { request_type: "tutor" }),
    supabase.rpc("get_top_pairing_request", { request_type: "student" }),
  ]);

  const [tutorQueue, studentQueue] = [
    tutorQueueResult.data ?? [],
    studentQueueResult.data ?? [],
  ] as [QueueItem[], QueueItem[]];

  console.log("tutorQueue:", tutorQueue);
  console.log("studentQueue:", studentQueue);

  // Helper to shuffle a queue

  // Alternate pairing: student, tutor, student, tutor
  const maxLength = Math.max(studentQueue.length, tutorQueue.length);

  const studentTutorMatches: QueueItemMatch[] = [];
  for (let i = 0; i < maxLength; i++) {
    if (i < studentQueue.length) {
      const studentReq = studentQueue[i];
      const { data } = await supabase
        .rpc("get_best_match", {
          request_type: "student",
          request_id: studentReq.pairing_request_id,
        })
        .single();

      if (data) {
        await updatePairingStatus(studentReq.pairing_request_id, "paired");
      }
      data
        ? studentTutorMatches.push(data as QueueItemMatch)
        : logs.push({
            message: "Failed to find pairing",
            type: "pairing-selection-failed",
            error: true,

            metadata: {
              pairing_request_id: studentReq.pairing_request_id,
            },
          });

      console.log("Student match:", data);
    }

    if (i < tutorQueue.length) {
      const tutorReq = tutorQueue[i];
      const { data } = await supabase
        .rpc("get_best_match", {
          request_type: "tutor",
          request_id: tutorReq.pairing_request_id,
        })
        .single();
      console.log("Tutor match:", data);
      if (data) {
        await updatePairingStatus(tutorReq.pairing_request_id, "paired");
        studentTutorMatches.push(data as QueueItemMatch);
      } else {
        logs.push({
          message: "Failed to find pairing",
          type: "pairing-selection-failed",
          error: true,
          metadata: {
            pairing_request_id: tutorReq.pairing_request_id,
          },
        });
      }
    }
  }
  console.log("LOGS: ", logs);
  console.log("MATCHES", studentTutorMatches);

  await supabase.from("pairing_matches").insert(studentTutorMatches);
  await supabase.from("pairing_logs").insert(logs);
};
