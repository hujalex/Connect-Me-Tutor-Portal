import { Profile } from "@/types";

type PairingStatus = "pending" | "accepted" | "rejected";

export type PairingRequest = {
  id: string; //uuid;
  type: "student" | "tutor";
  userId: string; //uuid
  profile: Profile;
  status: PairingStatus;
  priority: number;
  createdAt: Date;
};
export type PairingMatch = {
  id: string; //uuid
  tutor_id: string; //uuid
  student_id: string; //uuid
  tutor_status: PairingStatus;
  similarity: number; //uuid
  createdAt: Date;
};

export type PairingLog = {
  id: string;
  type:
    | "pairing-match"
    | "pairing-match-rejected"
    | "pairing-match-accepted"
    | "pairing-selection-failed";
  profile: {
    firstName: string;
    lastName: string;
    role: "student" | "tutor";
  };
  message: string;
  status: string;
  createdAt: string;
};

// DATABSE TABLE SCHEMA PairingLog = {
//   message: string;
//   type:
//     | "pairing-match"
//     | "pairing-match-rejected"
//     | "pairing-match-accepted"
//     | "pairing-selection-failed";
//   error?: boolean;
//   role?: "student" | "tutor";
//   metadata?: Record<string, any>;
// };
