import { PHASE_DEVELOPMENT_SERVER } from "next/dist/shared/lib/constants";

interface Profile {
  id: string;
  createdAt: string; // Date when the profile was created
  role: "Student" | "Tutor" | "Admin";
  userId: string; // Foreign key or identifier
  firstName: string;
  lastName: string;
  age?: string;
  grade?: string;
  gender?: string;
  dateOfBirth?: string | null; // Format: YYYY-MM-DD
  startDate: string; // Format: YYYY-MM-DD, start date of the user's involvement
  availability: { day: string; startTime: string; endTime: string }[]; // Example: [{ day: "Monday", time: "3PM-6PM" }]
  email: string;
  phoneNumber: string;
  parentName?: string; // Optional
  parentPhone?: string; // Optional
  parentEmail?: string; // Optional
  timeZone: string; // Example: 'America/New_York'
  subjects_of_interest: string[]; // Array of subjects
  status: "Active" | "Inactive" | "Deleted";
  tutorIds: string[];
  studentNumber: string | null;
  settingsId: string;
  languages_spoken: string[];
}

interface Session {
  id: string;
  enrollmentId: string | null;
  createdAt: string;
  environment: "Virtual" | "In-Person";
  student: Profile | null;
  tutor: Profile | null;
  date: string;
  summary: string;
  // meetingId: string;p
  meeting?: Meeting | null;
  status: "Active" | "Complete" | "Cancelled" | "Rescheduled";
  session_exit_form: string;
  isQuestionOrConcern: boolean;
  isFirstSession: boolean;
  duration: number;
}

interface Meeting {
  id: string;
  createdAt: string;
  password: string;
  meetingId: string;
  link: string;
  name: string;
}

interface Notification {
  createdAt: string;
  id: string;
  summary: string; // You can adjust the name here for clarity
  sessionId: string;
  previousDate: string;
  suggestedDate: string;
  student: Profile | null;
  tutor: Profile | null;
  status: "Active" | "Resolved";
}

// Type for Events
interface Event {
  createdAt: string;
  date: string; // Format: YYYY-MM-DD
  summary: string;
  tutorId: string;
  id: string;
  hours: number;
  type: string;
}

// Type for Student s
interface Enrollment {
  id: string;
  createdAt: string;
  student: Profile | null;
  tutor: Profile | null;
  summary: string;
  startDate: string;
  endDate: string | null;
  availability: Availability[]; // Ensure startTime and endTime have AM/PM format
  meetingId: string;
  summerPaused: boolean;
  duration: number;
  frequency: string;
}

// Define the type for availability
interface Availability {
  day: string;
  startTime: string;
  endTime: string;
}

interface CreatedProfileData {
  role: "Student" | "Tutor" | "Admin";
  firstName: string;
  lastName: string;
  age: string;
  grade: string;
  gender: string,
  startDate: string,
  availability: Availability[],
  email: string;
  parentName: string;
  parentPhone: string;
  parentEmail: string;
  phoneNumber: string;
  timezone: string;
  subjects_of_interest: string[];
  status: "Active",
  studentNumber: string
  languages_spoken: string[], 
  password: string;
}
