// lib/admins.actions.ts

import { createClient } from '@supabase/supabase-js'

// Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function getAllUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')

  if (error) throw error
  return data
}

export async function getUsersByRole(role: 'STUDENT' | 'TUTOR' | 'ADMIN') {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .eq('role', role)

  if (error) throw error
  return data
}

export async function updateUserStatus(userId: string, status: 'ACTIVE' | 'GHOST' | 'DELETED') {
  const { data, error } = await supabase
    .from('users')
    .update({ status: status })
    .eq('id', userId)
    .single()

  if (error) throw error
  return data
}

export async function createTutorAccount(tutorData: any) {
  const { data, error } = await supabase
    .from('users')
    .insert({ ...tutorData, role: 'TUTOR' })
    .single()

  if (error) throw error
  return data
}

export async function assignTutorToStudent(studentId: string, tutorId: string, meetingDays: string[]) {
  const { data, error } = await supabase
    .from('student_tutor_assignments')
    .insert({ student_id: studentId, tutor_id: tutorId, meeting_days: meetingDays })
    .single()

  if (error) throw error
  return data
}

export async function getWeeklySchedule(weekStart: string, weekEnd: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      tutors (name),
      students (name)
    `)
    .gte('date', weekStart)
    .lte('date', weekEnd)

  if (error) throw error
  return data
}

export async function addWeek(weekStart: string, weekEnd: string) {
  // This function might involve complex logic to generate sessions for the new week
  // Here's a simplified version that just adds a record to track the added week
  const { data, error } = await supabase
    .from('added_weeks')
    .insert({ week_start: weekStart, week_end: weekEnd })
    .single()

  if (error) throw error
  return data
}

export async function getTutorReschedulingNotifications() {
  const { data, error } = await supabase
    .from('rescheduling_notifications')
    .select(`
      *,
      tutors (name),
      sessions (*)
    `)
    .eq('status', 'UNREAD')

  if (error) throw error
  return data
}

export async function createSession(sessionData: any) {
  const { data, error } = await supabase
    .from('sessions')
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

export async function assignGoogleMeetLink(sessionId: string, meetLink: string) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ google_meet_link: meetLink })
    .eq('id', sessionId)
    .single()

  if (error) throw error
  return data
}

export async function generateReports(startDate: string, endDate: string) {
  // This is a placeholder for a potentially complex reporting function
  // The actual implementation would depend on your specific reporting needs
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      tutors (name),
      students (name)
    `)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw error
  return data
}