export interface Availability {
  day: string;
  startTime: string;
  endTime: string;
}

export interface UpdateProfileInput {
  profileId: string;
  availability?: { day: string; startTime: string; endTime: string }[];
  subjectsOfInterest?: string[];
  languagesSpoken?: string[];
}

export type ProfilePairingMetadata = UpdateProfileInput;
