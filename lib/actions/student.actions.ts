// lib/student.actions.ts

import { createClient } from '@supabase/supabase-js'

// Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function getStudentProfile(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('students')
      .select(`
        *,
        users (*)
      `)
      .eq('id', studentId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching student profile:', error)
    throw error
  }
}

export async function updateStudentProfile(studentId: string, profileData: any) {
  try {
    const { data, error } = await supabase
      .from('students')
      .update(profileData)
      .eq('id', studentId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating student profile:', error)
    throw error
  }
}

export async function getStudentSessions(studentId: string, startDate: string, endDate: string) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        *,
        tutors (name)
      `)
      .eq('student_id', studentId)
      .gte('date', startDate)
      .lte('date', endDate)

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching student sessions:', error)
    throw error
  }
}

export async function enrollInSession(studentId: string, sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({ student_id: studentId })
      .eq('id', sessionId)
      .is('student_id', null)  // Ensure the session is not already taken
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error enrolling in session:', error)
    throw error
  }
}

export async function cancelEnrollment(sessionId: string) {
  try {
    const { data, error } = await supabase
      .from('sessions')
      .update({ student_id: null })
      .eq('id', sessionId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error cancelling enrollment:', error)
    throw error
  }
}

export async function getStudentTutor(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('student_tutor_assignments')
      .select(`
        *,
        tutors (*)
      `)
      .eq('student_id', studentId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching student tutor:', error)
    throw error
  }
}

export async function submitFeedback(sessionId: string, feedback: string, rating: number) {
  try {
    const { data, error } = await supabase
      .from('session_feedback')
      .insert({
        session_id: sessionId,
        feedback: feedback,
        rating: rating
      })
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error submitting feedback:', error)
    throw error
  }
}

export async function getStudentProgress(studentId: string) {
  try {
    const { data, error } = await supabase
      .from('student_progress')
      .select('*')
      .eq('student_id', studentId)
      .order('date', { ascending: false })

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching student progress:', error)
    throw error
  }
}

export async function requestSessionReschedule(sessionId: string, newDate: string) {
  try {
    const { data, error } = await supabase
      .from('reschedule_requests')
      .insert({
        session_id: sessionId,
        requested_date: newDate,
        status: 'PENDING'
      })
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error requesting session reschedule:', error)
    throw error
  }
}