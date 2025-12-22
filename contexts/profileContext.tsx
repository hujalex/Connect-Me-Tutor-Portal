"use client"

import { createContext, useContext, useState } from 'react'
import type { ReactNode } from 'react'
import type { Profile } from '@/types'

type ProfileContextValue = {
    role: string | null;
    profile: Profile | null;
    setRole: (role: string | null) => void;
    setProfile: (profile: Profile | null) => void;
}

const ProfileContext = createContext<ProfileContextValue | null>(null)

export function ProfileContextProvider({ children }: { children: ReactNode }) {
    const [role, setRole] = useState<string | null>(null)
    const [profile, setProfile] = useState<Profile | null>(null)

    const contextValue: ProfileContextValue = {
        role,
        profile,
        setRole,
        setProfile
    }

    return (
        <ProfileContext.Provider value={contextValue}>{children}</ProfileContext.Provider>
    )
}

export function useProfile(): ProfileContextValue {
    const context = useContext(ProfileContext)
    if (context === null) {
        throw new Error('useProfile must be used within ProfileContextProvider')
    }
    return context
}