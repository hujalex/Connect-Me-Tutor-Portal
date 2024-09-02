// lib/user.actions.ts

import { createClient } from '@supabase/supabase-js'

// Supabase client
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

export async function updateProfile(userId: string, profileData: any) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update(profileData)
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error updating profile:', error)
    throw error
  }
}

export async function createUser(userData: any) {
  try {
    const { data, error } = await supabase
      .auth.admin.createUser({
        email: userData.email,
        password: userData.password,
        email_confirm: true
      })

    if (error) throw error

    // If you need to store additional user data, you can do it here
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: data.user.id,
        ...userData
      })
      .single()

    if (profileError) throw profileError

    return { user: data.user, profile: profileData }
  } catch (error) {
    console.error('Error creating user:', error)
    throw error
  }
}

export async function deactivateUser(userId: string) {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .update({ status: 'GHOST' })
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
      .from('profiles')
      .update({ status: 'ACTIVE' })
      .eq('user_id', userId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error reactivating user:', error)
    throw error
  }
}

export const logoutUser = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Error logging out:', error.message);
    } else {
      console.log('User logged out successfully');
    }
  } catch (error) {
    console.error('Unexpected error logging out:', error);
  }
};


export const getProfileRole = async (userId: string): Promise<string | null> => {
  if (!userId) {
    console.error('User ID is required to fetch profile role');
    return null;
  }

  const { data, error } = await supabase
    .from('profiles')
    .select('profilerole')
    .eq('id', userId)
    .single();

  if (error) {
    console.error('Error fetching profile role:', error.message);
    return null;
  }

  return data?.profilerole || null;
};


export async function getUserInfo() {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return null; // Return null if no user or error occurs
  }
  return user;
}
