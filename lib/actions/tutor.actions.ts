// lib/tutors.actions.ts

import { createClient } from '@supabase/supabase-js'

// Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function getTutorProfile(tutorId: string) {
  const { data, error } = await supabase
    .from('tutors')
    .select(`
      *,
      users (*),
      tutor_specializations (*)
    `)
    .eq('id', tutorId)
    .single()

  if (error) throw error
  return data
}

export async function updateTutorProfile(tutorId: string, profileData: any) {
  const { data, error } = await supabase
    .from('tutors')
    .update(profileData)
    .eq('id', tutorId)
    .single()

  if (error) throw error
  return data
}

export async function getTutorStudents(tutorId: string) {
  const { data, error } = await supabase
    .from('students')
    .select(`
      *,
      users (*)
    `)
    .eq('tutor_id', tutorId)

  if (error) throw error
  return data
}

export async function getTutorSessions(tutorId: string, startDate: string, endDate: string) {
  const { data, error } = await supabase
    .from('sessions')
    .select(`
      *,
      students (
        *,
        users (*)
      )
    `)
    .eq('tutor_id', tutorId)
    .gte('date', startDate)
    .lte('date', endDate)

  if (error) throw error
  return data
}

export async function rescheduleSession(sessionId: string, newDate: string) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ date: newDate })
    .eq('id', sessionId)
    .single()

  if (error) throw error
  return data
}

export async function cancelSession(sessionId: string) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ status: 'CANCELLED' })
    .eq('id', sessionId)
    .single()

  if (error) throw error
  return data
}

export async function addSessionNotes(sessionId: string, notes: string) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ notes: notes })
    .eq('id', sessionId)
    .single()

  if (error) throw error
  return data
}

export async function getTutorAvailability(tutorId: string) {
  const { data, error } = await supabase
    .from('tutor_availability')
    .select('*')
    .eq('tutor_id', tutorId)

  if (error) throw error
  return data
}

export async function updateTutorAvailability(tutorId: string, availabilityData: any) {
  const { data, error } = await supabase
    .from('tutor_availability')
    .upsert({ tutor_id: tutorId, ...availabilityData })
    .eq('tutor_id', tutorId)

  if (error) throw error
  return data
}

export async function getTutorResources() {
  const { data, error } = await supabase
    .from('tutor_resources')
    .select('*')

  if (error) throw error
  return data
}

export async function logSessionAttendance(sessionId: string, attended: boolean) {
  const { data, error } = await supabase
    .from('sessions')
    .update({ attended: attended })
    .eq('id', sessionId)
    .single()

  if (error) throw error
  return data
}