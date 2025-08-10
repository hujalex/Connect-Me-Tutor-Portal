export interface UpdateProfileInput {
  profileId: string
  availability?: { day: string; startTime: string; endTime: string }[]
  subjectsOfInterest?: string[]
  languagesSpoken?: string[] // Make sure this exists in your DB
}

export type ProfilePairingMetadata = UpdateProfileInput
