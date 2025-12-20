import React, { createContext, useContext, useState, ReactNode } from 'react'
import { Profile } from '@/types'

interface UserContextType {
    role: string | null;
    profile: Profile | null;
    setRole: (role: string | null) => void;
    setProfile: (profile: Profile | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined)

export const userContextProvider = ({ children }: {children: ReactNode }) => {
    const [role, setRole] = useState<string>();
    const [profile, setProfile] = useState<Profile>();

    return (
        <UserContext.Provider value = {{role, profile, setRole, setProfile}}>
            { children }
        </UserContext>
    )
}