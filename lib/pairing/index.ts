import { createClient } from "../supabase/server";
import { Table } from "../supabase/tables";

type QueueItem = {
  pairing_request_id: string;
  profile_id: string;
};

export const runPairingWorkflow = async () => {
  const supabase = createClient();

  //retrieves all pairing requests tutor & student
  const que = await supabase.from(Table.PairingRequests).select("*");

  const [tutorQueueResult, studentQueueResult] = await Promise.all([
    supabase.rpc("get_top_pairing_request", {
      request_type: "tutor",
    }),
    supabase.rpc("get_top_pairing_request", {
      request_type: "student",
    }),
  ]);

  const [tutorQueue, studentQueue] = [
    tutorQueueResult.data,
    studentQueueResult,
  ];

  console.log(tutorQueueResult, studentQueueResult);

  // console.log("que: ", que);
};
