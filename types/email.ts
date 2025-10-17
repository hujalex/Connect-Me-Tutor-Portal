import { Profile, Meeting, Availability } from "@/types";


export interface PairingConfirmationEmailProps {
  tutor: Profile;
  student: Profile;
  startDate: string;
  availability: Availability;
  meeting: Meeting;
  isPreview?: boolean;
}

export interface PairingRequestNotificationEmailProps {
  tutor: Profile;
  student: Profile;
  isPreview?: boolean;
}
