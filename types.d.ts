// Profile type for User details
interface UserProfile {
    userId: string;
    dateOfBirth: string; // Format: YYYY-MM-DD
    gender: 'Male' | 'Female' | 'Other';
    role: 'Student' | 'Tutor' | 'Admin';
    parentName?: string; // Optional
    parentPhone?: string; // Optional
    parentEmail?: string; // Optional
    timeZone: string; // example., 'America/New_York'
    subjectsOfInterest: string[];
    firstSessionDate?: string; // Format: YYYY-MM-DD (Optional)
    currentMeetingDatesTimes?: string[]; // Array of date strings in YYYY-MM-DD format or with times (Optional)
    status: 'Active' | 'Ghost' | 'Deleted';
  }
  
  // Type for Events
  interface Event {
    date: string; // Format: YYYY-MM-DD
    type: 'Session' | 'Meeting' | 'Referral';
    environment: 'In-Person' | 'Virtual';
    googleMeetingLinkId?: string; // Optional
  }
  
  // Type for Student Enrollments
  interface StudentEnrollment {
    dateOfBirth: string; // Format: YYYY-MM-DD
    tutoringDuration: number; // in weeks or months depending on the use case
    numberOfDaysPerWeek: number;
    firstSessionDate: string; // Format: YYYY-MM-DD
    currentMeetingDatesTimes?: string[]; // Array of date strings in YYYY-MM-DD format or with times (Optional)
    creationDate: string; // Format: YYYY-MM-DD
    studentId: string;
    tutorId: string;
  }
  