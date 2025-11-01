interface AvailabilityItem {
  // Fill in based on the actual structure inside the [Object] array
  day?: string;
  start_time?: string;
  end_time?: string;
}

export interface Person {
  id: string;
  email: string;
  user_id: string;
  last_name: string;
  first_name: string;
  role: string;
}

export interface SharedEnrollment {
  id: string;
  created_at: string; // ISO date string
  summary: string;
  start_date: string; // ISO date string (YYYY-MM-DD)
  end_date: string; // ISO date string (YYYY-MM-DD)
  availability: AvailabilityItem[];
  meetingid: string;
  paused: boolean;
  duration: number;
  student: Person;
  tutor: Person;
}
