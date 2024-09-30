// lib/admins.actions.ts

// lib/student.actions.ts
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { Profile, Session, Notification, Event } from '@/types'
import { getProfileWithProfileId } from './user.actions'


const supabase = createClientComponentClient({
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
  supabaseKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
});

export async function getAllSessions(startDate?: string, endDate?: string): Promise<Session[]> {
  let query = supabase
    .from('Sessions')
    .select(`
      id,
      created_at,
      environment,
      student_id,
      tutor_id,
      date,
      summary,
      meeting_id
    `)

  if (startDate) {
    query = query.gte('date', startDate);
  }
  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching student sessions:', error.message);
    throw error;
  }

  // Map the result to the Session interface
  const sessions: Session[] = await Promise.all(data.map(async (session: any) => ({
    id: session.id,
    createdAt: session.created_at,
    environment: session.environment,
    date: session.date,
    summary: session.summary,
    meetingId: session.meeting_id,
    student: await getProfileWithProfileId(session.student_id),
    tutor: await getProfileWithProfileId(session.tutor_id),
    status:session.status
  })));

  return sessions;
}

export async function rescheduleSession(sessionId: string, newDate: string) {
  const { data, error } = await supabase
    .from('Sessions')
    .update({ date: newDate })
    .eq('id', sessionId)
    .single()

  if (error) throw error
  return data
}

export async function getUsers() {
  const { data, error } = await supabase
    .from('Profiles')
    .select('*')

  if (error) throw error
  return data
}

export async function getAllProfiles(role:'Student'|'Tutor'|'Admin') {
  try {
    const { data, error } = await supabase
      .from('Profiles')
      .select(`
        id,
        created_at,
        role,
        user_id,
        first_name,
        last_name,
        date_of_birth,
        start_date,
        availability,
        email,
        parent_name,
        parent_phone,
        parent_email,
        tutor_ids,
        timezone,
        subjects_of_interest,
        status
      `)
      .eq("role",role);

    if (error) {
      console.error('Error fetching profile:', error.message);
      console.error('Error details:', error);
      return null;
    }

    if (!data) {
      console.log('No profiles found');
      return null;
    }

  // Mapping the fetched data to the Profile object
  const userProfiles: Profile[] = data.map((profile: any) => ({
    id: profile.id,
    createdAt: profile.created_at,
    role: profile.role,
    userId: profile.user_id,
    firstName: profile.first_name,
    lastName: profile.last_name,
    dateOfBirth: profile.date_of_birth,
    startDate: profile.start_date,
    availability: profile.availability,
    email: profile.email,
    parentName: profile.parent_name,
    parentPhone: profile.parent_phone,
    parentEmail: profile.parent_email,
    tutorIds: profile.tutor_ids,
    timeZone: profile.timezone,
    subjectsOfInterest: profile.subjects_of_interest,
    status: profile.status,
  }));


    console.log('Mapped profile data:', userProfiles);
    return userProfiles;
  } catch (error) {
    console.error('Unexpected error in getProfile:', error);
    return null;
  }
}


export async function getUsersByRole(role: 'STUDENT' | 'TUTOR' | 'ADMIN') {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', role)

  if (error) throw error
  return data
}

export async function getAllNotifications(): Promise<Notification[] | null> {
  try {
    // Fetch meeting details from Supabase
    const { data, error } = await supabase
      .from('Notifications')
      .select(`
        id,
        created_at,
        session_id,
        previous_date,
        suggested_date,
        tutor_id,
        student_id,
        status,
        summary
      `);
    
    // Check for errors and log them
    if (error) {
      console.error('Error fetching notification details:', error.message);
      return null; // Returning null here is valid since the function returns Promise<Notification[] | null>
    }

    // Check if data exists
    if (!data) {
      console.log('No notifications found:');
      return null; // Valid return
    }

    // Mapping the fetched data to the Notification object
    const notifications: Notification[] = await Promise.all(data.map(async (notification: any) => ({
      createdAt: notification.created_at,
      id: notification.id,
      summary: notification.summary,
      sessionId: notification.session_id,
      previousDate: notification.previous_date,
      suggestedDate: notification.suggested_date,
      student: await getProfileWithProfileId(notification.student_id),
      tutor: await getProfileWithProfileId(notification.tutor_id),
      status: notification.status
    })));

    return notifications; // Return the array of notifications
  } catch (error) {
    console.error('Unexpected error in getMeeting:', error);
    return null; // Valid return
  }
}

export const updateNotification = async (notificationId: string, status: 'Active' | 'Resolved') => {
  try {
      const { data, error } = await supabase
          .from('Notifications') // Adjust this table name to match your database
          .update({ status: status }) // Update the status field
          .eq('id', notificationId); // Assuming `id` is the primary key for the notifications table

      if (error) {
          throw error; // Handle the error as needed
      }

      return data; // Return the updated notification data or whatever is needed
  } catch (error) {
      console.error('Error updating notification:', error);
      throw new Error('Failed to update notification');
  }
};


export const addStudent = async (studentData: Partial<Profile>): Promise<Profile> => {
  const supabase = createClientComponentClient();

  try {
    console.log(studentData)
    if (!studentData.email) {
      throw new Error('Email is required to create a student profile');
    }

    const tempPassword = studentData.lastName || studentData.email + studentData.startDate

    const userId = await createUser(studentData.email,tempPassword)

    // Check if a user with this email already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('Profiles')
      .select('user_id')
      .eq('email', studentData.email)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is what we want
      throw userCheckError;
    }

    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // Create the student profile without id and createdAt
    const newStudentProfile = {
      user_id: userId,
      role: 'Student',
      first_name: studentData.firstName || '',
      last_name: studentData.lastName || '',
      date_of_birth: studentData.dateOfBirth || '',
      start_date: studentData.startDate || new Date().toISOString(),
      availability: studentData.availability || [],
      email: studentData.email,
      parent_name: studentData.parentName || '',
      parent_phone: studentData.parentPhone || '',
      parent_email: studentData.parentEmail || '',
      timezone: studentData.timeZone || '',
      subjects_of_interest: studentData.subjectsOfInterest || [],
      tutor_ids: [], // Changed from tutorIds to tutor_ids
      status: 'Active',
    };

    // Add student profile to the database
    const { data: profileData, error: profileError } = await supabase
      .from('Profiles') // Ensure 'profiles' is correctly cased
      .insert(newStudentProfile)
      .select('*');

    if (profileError) throw profileError;

    // Ensure profileData is defined and cast it to the correct type
    if (!profileData) {
      throw new Error('Profile data not returned after insertion');
    }

    // Type assertion to ensure profileData is of type Profile
    const createdProfile: any = profileData;

    // Return the newly created profile data, including autogenerated fields
    return {
      id: createdProfile.id, // Assuming 'id' is the generated key
      createdAt: createdProfile.createdAt, // Assuming 'created_at' is the generated timestamp
      userId: createdProfile.userId, // Adjust based on your schema
      role: createdProfile.role,
      firstName: createdProfile.firstName,
      lastName: createdProfile.lastName,
      dateOfBirth: createdProfile.dateOfBirth,
      startDate: createdProfile.startDate,
      availability: createdProfile.availability,
      email: createdProfile.email,
      parentName: createdProfile.parentName,
      parentPhone: createdProfile.parentPhone,
      parentEmail: createdProfile.parentEmail,
      timeZone: createdProfile.timeZone,
      subjectsOfInterest: createdProfile.subjectsOfInterest,
      tutorIds: createdProfile.tutorIds,
      status: createdProfile.status,
    };
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

export const addTutor = async (tutorData: Partial<Profile>): Promise<Profile> => {
  const supabase = createClientComponentClient();

  try {
    console.log(tutorData)
    if (!tutorData.email) {
      throw new Error('Email is required to create a student profile');
    }

    const tempPassword = tutorData.lastName || tutorData.email + tutorData.startDate

    const userId = await createUser(tutorData.email,tempPassword)

    // Check if a user with this email already exists
    const { data: existingUser, error: userCheckError } = await supabase
      .from('Profiles')
      .select('user_id')
      .eq('email', tutorData.email)
      .single();

    if (userCheckError && userCheckError.code !== 'PGRST116') {
      // PGRST116 means no rows returned, which is what we want
      throw userCheckError;
    }

    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // Create the student profile without id and createdAt
    const newTutorProfile = {
      user_id: userId,
      role: 'Tutor',
      first_name: tutorData.firstName || '',
      last_name: tutorData.lastName || '',
      date_of_birth: tutorData.dateOfBirth || '',
      start_date: tutorData.startDate || new Date().toISOString(),
      availability: tutorData.availability || [],
      email: tutorData.email,
      timezone: tutorData.timeZone || '',
      subjects_of_interest: tutorData.subjectsOfInterest || [],
      tutor_ids: [], // Changed from tutorIds to tutor_ids
      status: 'Active',
    };

    // Add tutor profile to the database
    const { data: profileData, error: profileError } = await supabase
      .from('Profiles') // Ensure 'profiles' is correctly cased
      .insert(newTutorProfile)
      .select('*');

    if (profileError) throw profileError;

    // Ensure profileData is defined and cast it to the correct type
    if (!profileData) {
      throw new Error('Profile data not returned after insertion');
    }

    // Type assertion to ensure profileData is of type Profile
    const createdProfile: any = profileData;

    // Return the newly created profile data, including autogenerated fields
    return {
      id: createdProfile.id, // Assuming 'id' is the generated key
      createdAt: createdProfile.createdAt, // Assuming 'created_at' is the generated timestamp
      userId: createdProfile.userId, // Adjust based on your schema
      role: createdProfile.role,
      firstName: createdProfile.firstName,
      lastName: createdProfile.lastName,
      dateOfBirth: createdProfile.dateOfBirth,
      startDate: createdProfile.startDate,
      availability: createdProfile.availability,
      email: createdProfile.email,
      parentName: createdProfile.parentName,
      parentPhone: createdProfile.parentPhone,
      parentEmail: createdProfile.parentEmail,
      timeZone: createdProfile.timeZone,
      subjectsOfInterest: createdProfile.subjectsOfInterest,
      tutorIds: createdProfile.tutorIds,
      status: createdProfile.status,
    };
  } catch (error) {
    console.error('Error adding student:', error);
    throw error;
  }
};

export const createUser = async (email: string,password:string): Promise<string | null> => {
  try {
    // Call signUp to create a new user
    const { data, error } = await supabase.auth.signUp({
      email,
      password
    });

    if (error) {
      throw new Error(`Error creating user: ${error.message}`);
    }

    console.log('User created successfully:', data);

    // Return the user ID
    return data?.user?.id || null; // Use optional chaining to safely access id
  } catch (error) {
    console.error('Error creating user:', error);
    return null; // Return null if there was an error
  }
};


export async function assignTutorToStudent(studentId: string, tutorId: string, meetingDays: string[]) {
  const { data, error } = await supabase
    .from('student_tutor_assignments')
    .insert({ student_id: studentId, tutor_id: tutorId, meeting_days: meetingDays })
    .single()

  if (error) throw error
  return data
}


export async function createSession(sessionData: any) {
  const { data, error } = await supabase
    .from('Sessions')
    .insert(sessionData)
    .single()

  if (error) throw error
  return data
}

export async function getOpenMeetings() {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      tutors (name),
      students (name)
    `)
    .is('google_meet_link', null)
    .eq('status', 'SCHEDULED')

  if (error) throw error
  return data
}

export async function getEvents(tutorId:string): Promise<Event[] | null> {
  try {
    // Fetch meeting details from Supabase
    const { data, error } = await supabase
      .from('Events')
      .select(`
        id,
        created_at,
        date,
        summary,
        tutor_id,
        hours
      `)
      .eq("tutor_id",tutorId)
    
    // Check for errors and log them
    if (error) {
      console.error('Error fetching event details:', error.message);
      return null; // Returning null here is valid since the function returns Promise<Notification[] | null>
    }

    // Check if data exists
    if (!data) {
      console.log('No events found:');
      return null; // Valid return
    }

    // Mapping the fetched data to the Notification object
    const events: Event[] = await Promise.all(data.map(async (event: any) => ({
      createdAt: event.created_at,
      id: event.id,
      summary: event.summary,
      tutorId: event.tutor_id,
      date:event.date,
      hours:event.hours
    })));

    return events; // Return the array of notifications
  } catch (error) {
    console.error('Unexpected error in getMeeting:', error);
    return null; // Valid return
  }
}

export async function getEventsWithTutorMonth(tutorId:string, selectedMonth: string): Promise<Event[] | null> {
  try {
    // Fetch event details filtered by tutor IDs and selected month
    const { data, error } = await supabase
      .from('Events')
      .select(`
        id,
        created_at,
        date,
        summary,
        tutor_id,
        hours
      `)
      .eq('tutor_id', tutorId) // Filter by tutor IDs
      .gte('date', selectedMonth) // Filter events from the start of the selected month
      .lt('date', new Date(new Date(selectedMonth).setMonth(new Date(selectedMonth).getMonth() + 1)).toISOString()); // Filter before the start of the next month
    
    // Check for errors and log them
    if (error) {
      console.error('Error fetching event details:', error.message);
      return null;
    }

    // Check if data exists
    if (!data) {
      console.log('No events found:');
      return null;
    }

    // Map the fetched data to the Event object
    const events: Event[] = data.map((event: any) => ({
      createdAt: event.created_at,
      id: event.id,
      summary: event.summary,
      tutorId: event.tutor_id,
      date: event.date,
      hours:event.hours
    }));

    return events; // Return the array of events
  } catch (error) {
    console.error('Unexpected error in getEventsWithTutorMonth:', error);
    return null;
  }
}


export async function createEvent(event:Event) {
      // Create a notification for the admin
      const { error: eventError } = await supabase
      .from('Events')
      .insert({
        date: event.date,
        summary:event.summary,
        tutor_id:event.tutorId,
        hours:event.hours
      });

    if (eventError) {
      throw eventError;
    }
}

export async function removeEvent(eventId:string) {
  // Create a notification for the admin
  const { error: eventError } = await supabase
  .from('Events')
  .delete()
  .eq('id',eventId)

if (eventError) {
  throw eventError;
}
}

export async function deactivateUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('Profiles')
      .update({ status: 'Inactive' })
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error deactivating user:', error)
    throw error
  }
}

export async function reactivateUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('Profiles')
      .update({ status: 'Active' })
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error reactivating user:', error)
    throw error
  }
}


