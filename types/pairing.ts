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
type pairing_matches = {
  id: string; //uuid
  tutorId: string; //uuid
  studentId: string; //uuid
  tutorAccepted: PairingStatus; //uuid
  studentAccepted: PairingStatus;
  tutorPairingRequestId: string; //uuid
  studentPairingRequestId: string; //uuid
  createdAt: Date;
};
